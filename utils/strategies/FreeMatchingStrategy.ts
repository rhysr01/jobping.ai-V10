// File: /utils/strategies/FreeMatchingStrategy.ts
// Purpose: Simple matching strategy for free tier users (1-step form)
// Free users provide: email, name, cities, career only
// Result: 5 matches

import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../lib/api-logger";
import type { JobWithMetadata } from "../../lib/types/job";
import { simplifiedMatchingEngine } from "../matching/core/matching-engine";
import { getDatabaseClient } from "../core/database-pool";

/**
 * FREE Tier User Preferences - ONLY fields collected from form
 * Form collects: email, fullName, cities (1-3), careerPath (exactly 1)
 * NO visa, NO entry_level, NO skills, NO industries (premium-only features)
 */
export interface FreeUserPreferences {
	email: string;
	target_cities: string[];
	career_path: string | string[] | null;
	subscription_tier: "free";
	user_id?: string; // Optional: if provided, skip user lookup by email
}

export interface MatchingResult {
	matches: JobWithMetadata[];
	matchCount: number;
	method: string;
	duration: number;
}

/**
 * Free Matching Strategy - LIGHTWEIGHT
 *
 * Ultra-simple matching for free tier:
 * - Step 1: Filter by cities AND careerPath only (boolean logic, fast)
 * - Step 2: Pass filtered results to AI for ranking
 * - Step 3: Return top 5
 *
 * Why lightweight:
 * - Free users only provide: cities, careerPath
 * - No skills, industries, visa, entry level data
 * - No PrefilterService complexity (that's for premium)
 * - Just: filter → AI rank → return 5
 */
export async function runFreeMatching(
	userPrefs: FreeUserPreferences,
	jobs: JobWithMetadata[],
	maxMatches: number = 5,
): Promise<MatchingResult> {
	const startTime = Date.now();

	try {
		apiLogger.info("[FREE] Starting lightweight free tier matching", {
			email: userPrefs.email,
			cities: userPrefs.target_cities,
			careerPath: userPrefs.career_path,
			jobsAvailable: jobs.length,
		});

		if (!jobs || jobs.length === 0) {
			apiLogger.warn("[FREE] No jobs available for matching", {
				email: userPrefs.email,
				cities: userPrefs.target_cities,
			});
			return {
				matches: [],
				matchCount: 0,
				method: "no_jobs_available",
				duration: Date.now() - startTime,
			};
		}

		// STAGE 1: Fast boolean filtering - cities AND careerPath ONLY
		// This is the entire prefilter for free tier - simple and fast!
		const careerPath = userPrefs.career_path; // Extract and check once

		const filtered = jobs.filter((job) => {
			// Match city: user selected city must match job city
			const cityMatch = userPrefs.target_cities.some((city) => {
				if (!job.city) return false; // Require city match for free tier
				return job.city.toLowerCase() === city.toLowerCase();
			});

			if (!cityMatch) return false; // City is required for free

			// Match career: job must have user's selected career path
			if (!careerPath) return false; // Career path required for free
			if (!job.categories || job.categories.length === 0) return false; // Job must have categories

			return job.categories.some((cat) => {
				const catLower = cat.toLowerCase();
				if (Array.isArray(careerPath)) {
					return careerPath.some(
						(userCareer) => catLower === userCareer.toLowerCase(),
					);
				}
				return catLower === (careerPath as string).toLowerCase();
			});
		});

		apiLogger.info("[FREE] Simple filter complete", {
			email: userPrefs.email,
			original: jobs.length,
			afterFilter: filtered.length,
			duration: Date.now() - startTime,
		});

		if (filtered.length === 0) {
			apiLogger.warn("[FREE] No jobs matched cities + careerPath", {
				email: userPrefs.email,
				cities: userPrefs.target_cities,
				careerPath: userPrefs.career_path,
			});
			return {
				matches: [],
				matchCount: 0,
				method: "no_matching_jobs",
				duration: Date.now() - startTime,
			};
		}

		// STAGE 2: AI ranking on filtered results (lightweight - only on relevant jobs)
		return await rankAndReturnMatches(
			userPrefs,
			filtered,
			"free_ai_ranked",
			startTime,
			maxMatches,
		);
	} catch (error) {
		apiLogger.error("[FREE] Matching error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "FreeMatchingStrategy",
				method: "runFreeMatching",
				tier: "free",
			},
			extra: {
				email: userPrefs.email,
				jobsCount: jobs.length,
				maxMatches,
				userPreferences: {
					target_cities: userPrefs.target_cities,
					career_path: userPrefs.career_path,
				},
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		throw error;
	}
}

/**
 * Rank jobs using AI and return top 5 matches
 * Only uses: email, target_cities, career_path (what FREE form provides)
 */
async function rankAndReturnMatches(
	userPrefs: FreeUserPreferences,
	jobs: JobWithMetadata[],
	method: string,
	startTime: number,
	maxMatches: number,
): Promise<MatchingResult> {
	try {
		// Use simplified matching engine with free tier configuration
		// Only pass required fields - no visa, entry_level, skills, industries
		const matchResult = await simplifiedMatchingEngine.findMatchesForFreeUser(
			{
				email: userPrefs.email,
				target_cities: userPrefs.target_cities,
				career_path: userPrefs.career_path || [],
				// FREE tier does NOT provide these (premium-only features):
				entry_level_preference: undefined, // Not collected by FREE form
				visa_status: undefined, // Not collected by FREE form
				subscription_tier: "free" as const,
				// Below are required by interface but not used by FREE tier AI matching:
				languages_spoken: [],
				roles_selected: [],
				work_environment: undefined,
				skills: [],
				industries: [],
				company_size_preference: "any",
				career_keywords: null,
			} as any,
			jobs as any,
		);

		const matches = (matchResult?.matches || [])
			.slice(0, maxMatches) // FREE: Use configurable match count
			.map((m: any) => {
				// Handle both formats: m.job (nested) and m directly (flat)
				const jobData = m.job || m;
				if (!jobData) {
					apiLogger.warn("[FREE] Match missing job data", {
						email: userPrefs.email,
						match: m,
					});
					return null;
				}
				return {
					...jobData,
					match_score: m.match_score || 0,
					match_reason: m.match_reason || "Matched",
				};
			})
			.filter(Boolean); // Remove null entries

		// If no matches found, try fallback with just city filter (more lenient)
		if (matches.length === 0 && jobs.length > 0) {
			apiLogger.warn(
				"[FREE] No matches from AI, using raw job list as fallback",
				{
					email: userPrefs.email,
					availableJobs: jobs.length,
					method: method,
				},
			);

			// Take first 5 jobs as fallback
			const fallbackMatches = jobs.slice(0, maxMatches).map((job: any) => ({
				...job,
				match_score: 0.5,
				match_reason:
					"Matching temporarily unavailable - showing available opportunities",
			}));

			apiLogger.info("[FREE] Using fallback job list", {
				email: userPrefs.email,
				fallbackMatches: fallbackMatches.length,
			});

			return {
				matches: fallbackMatches,
				matchCount: fallbackMatches.length,
				method: "free_fallback_jobs",
				duration: Date.now() - startTime,
			};
		}

		apiLogger.info("[FREE] Ranking complete", {
			email: userPrefs.email,
			inputJobs: jobs.length,
			outputMatches: matches.length,
			method: method,
			duration: Date.now() - startTime,
		});

		// Save matches to database
		let matchesToSave: any[] = []; // CRITICAL FIX: Initialize here to prevent ReferenceError
		if (matches.length > 0) {
			try {
				const supabase = getDatabaseClient();
				
				// Use user_id from userPrefs if available, otherwise lookup by email
				let userId: string;
				
				apiLogger.info("[FREE] User ID resolution debug", {
					email: userPrefs.email,
					provided_user_id: userPrefs.user_id,
					user_id_type: typeof userPrefs.user_id,
					has_user_id: !!userPrefs.user_id,
				});
				
				if (userPrefs.user_id) {
					userId = userPrefs.user_id;
					apiLogger.info("[FREE] Using provided user_id", {
						email: userPrefs.email,
						user_id: userId,
					});
				} else {
					// Fallback: lookup user by email (for backward compatibility)
					apiLogger.warn("[FREE] No user_id provided, falling back to email lookup", {
						email: userPrefs.email,
					});
					
					const { data: user, error: lookupError } = await supabase
						.from("users")
						.select("id")
						.eq("email", userPrefs.email)
						.single();

					if (lookupError || !user) {
						apiLogger.error("[FREE] User lookup failed", lookupError as Error, {
							email: userPrefs.email,
							error: lookupError,
						});
						throw new Error(`User not found for email: ${userPrefs.email}. Error: ${lookupError?.message || 'User not found'}`);
					}
					userId = user.id;
					apiLogger.info("[FREE] Looked up user_id by email", {
						email: userPrefs.email,
						user_id: userId,
					});
				}
				
				// Validate userId before proceeding
				if (!userId) {
					throw new Error(`Invalid user_id: ${userId} for email: ${userPrefs.email}`);
				}

				// CRITICAL: Verify user exists in database before inserting matches
				// This prevents foreign key constraint violations
				const { data: userExists, error: userCheckError } = await supabase
					.from("users")
					.select("id")
					.eq("id", userId)
					.single();

				if (userCheckError || !userExists) {
					apiLogger.error("[FREE] User verification failed before match insert", userCheckError as Error, {
						email: userPrefs.email,
						user_id: userId,
						error: userCheckError,
					});
					throw new Error(`User verification failed for user_id: ${userId}, email: ${userPrefs.email}. Error: ${userCheckError?.message || 'User not found'}`);
				}

				apiLogger.info("[FREE] User verified, proceeding with match insert", {
					email: userPrefs.email,
					user_id: userId,
				});

				// Get job_ids from job_hashes (now all jobs have proper job_hash values)
				const jobHashes = matches.map(m => String(m.job_hash));
				const { data: jobs } = await supabase
					.from("jobs")
					.select("id, job_hash")
					.in("job_hash", jobHashes);

				if (!jobs || jobs.length === 0) {
					throw new Error(`No jobs found for hashes: ${jobHashes.join(", ")}`);
				}

				// Create lookup map for job_hash -> job_id
				const jobHashToId = new Map(jobs.map(job => [job.job_hash, job.id]));

				matchesToSave = matches.map((m: any) => {
					const jobId = jobHashToId.get(String(m.job_hash));
					if (!jobId) {
						throw new Error(`Job ID not found for hash: ${m.job_hash}`);
					}

					// Fix match score normalization - check range before dividing
					const rawScore = m.match_score || 0;
					const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;

					return {
						user_id: userId,
						job_id: jobId,
						match_score: Number(normalizedScore),
						match_reason: String(m.match_reason || "Matched"),
						created_at: new Date().toISOString(),
					};
				});

				// Log what we're about to insert for debugging
				apiLogger.info("[FREE] About to insert matches", {
					email: userPrefs.email,
					user_id: userId,
					match_count: matchesToSave.length,
					sample_match: matchesToSave[0] ? {
						user_id: matchesToSave[0].user_id,
						job_id: matchesToSave[0].job_id,
						match_score: matchesToSave[0].match_score,
					} : null,
				});

				const { error } = await supabase.from("user_matches").insert(matchesToSave);

				if (error) {
					// Check if it's a foreign key constraint error
					const isForeignKeyError = error.code === '23503' || error.message?.includes('foreign key constraint');
					
					apiLogger.error(
						"[FREE] Failed to save matches to database",
						error as Error,
						{
							email: userPrefs.email,
							user_id: userId,
							matchCount: matchesToSave.length,
							errorCode: error.code,
							errorMessage: error.message,
							isForeignKeyError,
							sampleMatch: matchesToSave[0],
						},
					);

					if (isForeignKeyError) {
						// For foreign key errors, provide more context and suggest retry
						apiLogger.warn("[FREE] User may have been deleted by cleanup process during signup", {
							email: userPrefs.email,
							user_id: userId,
							error_code: error.code,
						});
						
						// Check if user still exists
						const { data: userStillExists } = await supabase
							.from("users")
							.select("id, free_expires_at")
							.eq("id", userId)
							.single();
							
						if (!userStillExists) {
							throw new Error(`User was deleted during signup process: user_id ${userId} for email ${userPrefs.email}. This may be due to cleanup process race condition.`);
						} else {
							throw new Error(`Foreign key constraint violation: user_id ${userId} exists but constraint failed for email ${userPrefs.email}. Original error: ${error.message}`);
						}
					} else {
						// CRITICAL FIX: Propagate error instead of silently continuing
						throw new Error(`Failed to save matches: ${error.message}`);
					}
				} else {
					apiLogger.info("[FREE] Successfully saved matches to database", {
						email: userPrefs.email,
						count: matchesToSave.length,
					});
				}
			} catch (err) {
				apiLogger.error("[FREE] Error saving matches", err as Error, {
					email: userPrefs.email,
					matchCount: matchesToSave.length,
				});

				// Capture in Sentry
				Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
					tags: {
						service: "FreeMatchingStrategy",
						method: "saveMatches",
						tier: "free",
					},
					extra: {
						email: userPrefs.email,
						matchCount: matchesToSave.length,
						operation: "database_save",
					},
					user: { email: userPrefs.email },
					level: "error",
				});
			}
		}

		return {
			matches,
			matchCount: matches.length,
			method: method,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		apiLogger.error("[FREE] Ranking error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "FreeMatchingStrategy",
				method: "rankJobsWithAI",
				tier: "free",
			},
			extra: {
				email: userPrefs.email,
				jobsCount: jobs.length,
				maxMatches,
				operation: "ai_ranking",
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		throw error;
	}
}
