import { Inngest } from "inngest";
import { logger } from "../monitoring";
import { simplifiedMatchingEngine } from "../../utils/matching/core/matching-engine";
import { getDatabaseClient } from "../../utils/core/database-pool";
import { ENV } from "../env";
import type { Job, UserPreferences } from "../../utils/matching/types";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

// Write our first Inngest Function
// This function will wait for one second before returning "Hello world!"
export const helloWorld = inngest.createFunction(
	{ id: "hello-world" },
	{ event: "test/hello.world" },
	async ({ event, step }) => {
		await step.sleep("wait-a-moment", "1s");

		return { message: `Hello ${event.data.email}!` };
	},
);

/**
 * Durable AI Matching Function
 *
 * This function handles AI matching with automatic retries and timeout protection.
 * It's designed to run long-running matching operations that might exceed Vercel's
 * function timeout limits (10-60s).
 *
 * Features:
 * - Automatic retries on failure
 * - Step-by-step execution (durable workflow)
 * - Timeout protection
 * - Error handling with fallback to rule-based matching
 */
export const performAIMatching = inngest.createFunction(
	{
		id: "perform-ai-matching",
		name: "Perform AI Matching",
		retries: 3, // Retry up to 3 times on failure
	},
	{ event: "matching/perform" },
	async ({ event, step }) => {
		const {
			userPrefs,
			jobs,
			userId: _userId,
			context,
		} = event.data as {
			userPrefs: UserPreferences;
			jobs: Job[];
			userId?: string;
			context?: {
				source?: string;
				requestId?: string;
			};
		};

		// Initialize matching engine directly (cannot serialize class instances in step.run)
		// Get OpenAI API key (same validation as embedding service)
		const openaiKey = ENV.OPENAI_API_KEY;
		const hasOpenAIKey = openaiKey && openaiKey.startsWith("sk-");

		if (!hasOpenAIKey) {
			logger.warn(
				"OPENAI_API_KEY not set or invalid, will use rule-based matching",
				{
					email: userPrefs.email,
					openaiKeyStatus: openaiKey ? "set but invalid format" : "not set",
				},
			);
		}
		// Step 1: Perform matching with timeout protection
		const matchResult = await step.run("perform-matching", async () => {
			const startTime = Date.now();

			try {
				logger.info("Starting AI matching via Inngest", {
					email: userPrefs.email,
					jobsCount: jobs.length,
					source: context?.source || "unknown",
				});

				const result = await simplifiedMatchingEngine.findMatchesForUser(
					userPrefs as any,
					jobs as any[],
					{ useAI: !!hasOpenAIKey },
				);

				const duration = Date.now() - startTime;
				logger.info("AI matching completed via Inngest", {
					email: userPrefs.email,
					matchesCount: result.matches.length,
					method: result.method,
					duration,
				});

				return result;
			} catch (error) {
				logger.error("AI matching failed in Inngest function", {
					error: error as Error,
					email: userPrefs.email,
					jobsCount: jobs.length,
				});

				// Fallback to rule-based matching
				logger.warn("Falling back to rule-based matching", {
					email: userPrefs.email,
				});

				const fallbackResult =
					await simplifiedMatchingEngine.findMatchesForUser(
						userPrefs as any,
						jobs as any[],
						{ useAI: false }, // Force rule-based matching
					);

				return fallbackResult;
			}
		});

		// Step 2: Save matches to database
		const savedMatches = await step.run("save-matches", async () => {
			if (!matchResult.matches || matchResult.matches.length === 0) {
				logger.warn("No matches to save", {
					email: userPrefs.email,
				});
				return { saved: 0 };
			}

			const supabase = getDatabaseClient();
			
			// First, get user_id from email
			const { data: user } = await supabase
				.from("users")
				.select("id")
				.eq("email", userPrefs.email)
				.single();

			if (!user) {
				throw new Error(`User not found for email: ${userPrefs.email}`);
			}

			// Then get job_ids from job_hashes
			const jobHashes = matchResult.matches.map(match => String(match.job_hash));
			const { data: jobs } = await supabase
				.from("jobs")
				.select("id, job_hash")
				.in("job_hash", jobHashes);

			if (!jobs || jobs.length === 0) {
				throw new Error(`No jobs found for hashes: ${jobHashes.join(", ")}`);
			}

			// Create lookup map for job_hash -> job_id
			const jobHashToId = new Map(jobs.map(job => [job.job_hash, job.id]));

			const matchEntries = matchResult.matches.map((match) => {
				// Normalize match_score to 0-1 range
				let normalizedScore = 0.75; // Default fallback
				if (match.match_score !== undefined && match.match_score !== null) {
					if (match.match_score > 1) {
						normalizedScore = match.match_score / 100;
					} else {
						normalizedScore = match.match_score;
					}
				}

				const jobId = jobHashToId.get(String(match.job_hash));
				if (!jobId) {
					throw new Error(`Job ID not found for hash: ${match.job_hash}`);
				}

				return {
					user_id: user.id,
					job_id: jobId,
					match_score: normalizedScore,
					match_reason: match.match_reason || "AI matched",
					created_at: new Date().toISOString(),
				};
			});

			const { data, error } = await supabase
				.from("user_matches")
				.upsert(matchEntries, {
					onConflict: "user_id,job_id",
				})
				.select();

			if (error) {
				logger.error("Failed to save matches", {
					error: error as Error,
					email: userPrefs.email,
					matchCount: matchEntries.length,
				});
				throw error;
			}

			logger.info("Matches saved successfully", {
				email: userPrefs.email,
				savedCount: data?.length || 0,
			});

			return { saved: data?.length || 0, matches: data };
		});

		return {
			success: true,
			email: userPrefs.email,
			matchesCount: matchResult.matches.length,
			method: matchResult.method,
			savedCount: savedMatches.saved,
		};
	},
);
