// File: /utils/strategies/FreeMatchingStrategy.ts
// Purpose: Simple matching strategy for free tier users (1-step form)
// Free users provide: email, name, cities, career only
// Result: 5 matches

import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../lib/api-logger";
import type { JobWithMetadata } from "../../lib/types/job";
import { getDatabaseClient } from "../core/database-pool";
import { LOG_MARKERS } from "../../lib/log-markers";
import { aiMatchingService } from "../matching/core/ai-matching.service";

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
		console.log(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.MATCHING_START} Starting lightweight free tier matching`, {
			email: userPrefs.email,
			cities: userPrefs.target_cities,
			careerPath: userPrefs.career_path,
			jobsAvailable: jobs.length,
		});
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
		// CRITICAL FIX: Don't use SimplifiedMatchingEngine which does ANOTHER prefilter
		// Jobs are already filtered by city + careerPath, so use AI matching directly
		return await rankAndReturnMatchesDirect(
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
 * Rank jobs using AI DIRECTLY - bypasses prefilter since jobs are already filtered
 * CRITICAL FIX: Jobs are already filtered by city + careerPath, so don't prefilter again
 */
async function rankAndReturnMatchesDirect(
	userPrefs: FreeUserPreferences,
	jobs: JobWithMetadata[],
	method: string,
	startTime: number,
	maxMatches: number,
): Promise<MatchingResult> {
	try {
		// CRITICAL FIX: Use AI matching DIRECTLY without prefilter
		// Jobs are already filtered by city + careerPath in runFreeMatching
		// Don't use SimplifiedMatchingEngine which does ANOTHER prefilter
		
		// Normalize career_path to array format
		const careerPathArray = Array.isArray(userPrefs.career_path)
			? userPrefs.career_path
			: userPrefs.career_path
				? [userPrefs.career_path]
				: [];
		
		const userForAI = {
			email: userPrefs.email,
			target_cities: userPrefs.target_cities,
			career_path: careerPathArray,
			subscription_tier: "free" as const,
		} as any;
		
		// Call AI matching directly on already-filtered jobs (max 20 for AI)
		let aiResults: any[] = [];
		try {
			aiResults = await aiMatchingService.findMatches(
				userForAI,
				jobs.slice(0, 20).map((j) => j as any),
			);
		} catch (aiError) {
			// CRITICAL: Capture AI matching errors to Sentry
			const error = aiError instanceof Error ? aiError : new Error(String(aiError));
			apiLogger.error("[FREE] AI matching service error", error, {
				email: userPrefs.email,
				jobsCount: jobs.length,
			});

			Sentry.captureException(error, {
				tags: {
					service: "FreeMatchingStrategy",
					method: "rankAndReturnMatchesDirect",
					operation: "ai_matching",
					tier: "free",
				},
				extra: {
					email: userPrefs.email,
					jobsCount: jobs.length,
					maxMatches,
				},
				user: { email: userPrefs.email },
				level: "error",
			});

			// Continue with empty results - fallback will handle it
			aiResults = [];
		}

		// Convert AI results to match format
		const matches = (aiResults || [])
			.slice(0, maxMatches)
			.map((m: any) => {
				const jobData = m.job || m;
				if (!jobData) {
					apiLogger.warn("[FREE] Match missing job data", {
						email: userPrefs.email,
						match: m,
					});
					return null;
				}
				// CRITICAL FIX: Ensure job_hash is preserved - it's required for saving matches
				const jobHash = jobData.job_hash || m.job_hash;
				if (!jobHash) {
					apiLogger.warn("[FREE] Match missing job_hash", {
						email: userPrefs.email,
						jobData: Object.keys(jobData),
						match: Object.keys(m),
					});
					return null;
				}
				return {
					...jobData,
					job_hash: jobHash, // Explicitly ensure job_hash is set
					match_score: m.unifiedScore?.overallScore || m.match_score || 0.8,
					match_reason: m.matchReason || m.match_reason || "AI matched",
				};
			})
			.filter(Boolean);
		
		apiLogger.info("[FREE] Direct AI matching complete", {
			email: userPrefs.email,
			inputJobs: jobs.length,
			aiResults: aiResults.length,
			outputMatches: matches.length,
		});

		// If no matches found, try fallback with filtered jobs (city + career path matched)
		// CRITICAL FIX: The `jobs` parameter here IS the filtered jobs (passed from runFreeMatching)
		if (matches.length === 0 && jobs.length > 0) {
			apiLogger.warn(
				"[FREE] No matches from direct AI, using filtered job list as fallback",
				{
					email: userPrefs.email,
					filteredJobs: jobs.length,
					method: method,
				},
			);

			// Take top filtered jobs as fallback (already matched city + career path)
			// CRITICAL FIX: Ensure job_hash is present for fallback matches
			const fallbackMatches = jobs.slice(0, maxMatches)
				.filter((job: any) => job.job_hash) // Only include jobs with job_hash
				.map((job: any) => ({
					...job,
					job_hash: job.job_hash, // Explicitly ensure job_hash is set
					match_score: 0.6, // Slightly higher score since they passed city/career filter
					match_reason:
						"Matched your city and career path preferences",
				}));

			apiLogger.info("[FREE] Using filtered fallback job list", {
				email: userPrefs.email,
				fallbackMatches: fallbackMatches.length,
			});

			return {
				matches: fallbackMatches,
				matchCount: fallbackMatches.length,
				method: "free_fallback_filtered",
				duration: Date.now() - startTime,
			};
		}

		apiLogger.info("[FREE] Direct ranking complete", {
			email: userPrefs.email,
			inputJobs: jobs.length,
			outputMatches: matches.length,
			method: method,
			duration: Date.now() - startTime,
		});

		// Save matches to database
		return await saveMatchesAndReturn(userPrefs, matches, method, startTime);
	} catch (error) {
		apiLogger.error("[FREE] Direct AI ranking error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "FreeMatchingStrategy",
				method: "rankAndReturnMatchesDirect",
				tier: "free",
			},
			extra: {
				email: userPrefs.email,
				jobsCount: jobs.length,
				maxMatches,
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		// Fallback: return filtered jobs as matches
		// CRITICAL FIX: Ensure job_hash is present for error fallback matches
		if (jobs.length > 0) {
			const fallbackMatches = jobs.slice(0, maxMatches)
				.filter((job: any) => job.job_hash) // Only include jobs with job_hash
				.map((job: any) => ({
					...job,
					job_hash: job.job_hash, // Explicitly ensure job_hash is set
					match_score: 0.5,
					match_reason: "Fallback match after error",
				}));

			return {
				matches: fallbackMatches,
				matchCount: fallbackMatches.length,
				method: "free_fallback_error",
				duration: Date.now() - startTime,
			};
		}

		throw error;
	}
}

/**
 * Save matches to database and return result
 */
async function saveMatchesAndReturn(
	userPrefs: FreeUserPreferences,
	matches: any[],
	method: string,
	startTime: number,
): Promise<MatchingResult> {
	if (matches.length === 0) {
		return {
			matches,
			matchCount: 0,
			method: method,
			duration: Date.now() - startTime,
		};
	}

	try {
		const supabase = getDatabaseClient();
		
		// Resolve user_id and verify user exists
		let userId: string;
		if (userPrefs.user_id) {
			// Verify the provided user_id actually exists
			const { data: userCheck, error: userCheckError } = await supabase
				.from("users")
				.select("id, email")
				.eq("id", userPrefs.user_id)
				.single();

			if (userCheckError || !userCheck) {
				// Fall back to email lookup if user_id is invalid
				const { data: user, error: lookupError } = await supabase
					.from("users")
					.select("id")
					.eq("email", userPrefs.email)
					.single();

				if (lookupError || !user) {
					throw new Error(
						`User not found: user_id ${userPrefs.user_id} invalid and email ${userPrefs.email} not found. ${lookupError?.message || userCheckError?.message || 'User not found'}`,
					);
				}
				userId = user.id;
			} else {
				userId = userCheck.id;
			}
		} else {
			const { data: user, error: lookupError } = await supabase
				.from("users")
				.select("id")
				.eq("email", userPrefs.email)
				.single();

			if (lookupError || !user) {
				throw new Error(`User not found: ${lookupError?.message || 'User not found'}`);
			}
			userId = user.id;
		}

		if (!userId) {
			throw new Error(`Invalid user_id for email: ${userPrefs.email}`);
		}

		// Final verification: ensure user exists before inserting matches
		const { data: finalUserCheck, error: finalCheckError } = await supabase
			.from("users")
			.select("id")
			.eq("id", userId)
			.single();

		if (finalCheckError || !finalUserCheck) {
			throw new Error(
				`User verification failed before saving matches: user_id ${userId} does not exist. ${finalCheckError?.message || 'User not found'}`,
			);
		}

		// Get job_ids from job_hashes
		// FIX: Filter out null/undefined hashes before lookup
		const jobHashes = matches
			.map(m => m.job_hash)
			.filter((hash): hash is string => hash != null && hash !== "")
			.map(hash => String(hash));

		if (jobHashes.length === 0) {
			throw new Error(`No valid job hashes found in matches. All hashes were null or empty.`);
		}

		const { data: jobs, error: jobLookupError } = await supabase
			.from("jobs")
			.select("id, job_hash")
			.in("job_hash", jobHashes);

		if (jobLookupError) {
			throw new Error(`Job lookup failed: ${jobLookupError.message}`);
		}

		if (!jobs || jobs.length === 0) {
			// FIX: Provide more context about which hashes failed
			const foundHashes = new Set(jobs?.map(j => j.job_hash) || []);
			const missingHashes = jobHashes.filter(h => !foundHashes.has(h));
			throw new Error(
				`No jobs found for hashes. Requested: ${jobHashes.length}, Found: ${jobs?.length || 0}. ` +
				`Missing hashes: ${missingHashes.slice(0, 5).join(", ")}${missingHashes.length > 5 ? "..." : ""}`
			);
		}

		// Create lookup map and prepare matches
		const jobHashToId = new Map(jobs.map(job => [job.job_hash, job.id]));
		let matchesToSave = matches.map((m: any) => {
			const jobId = jobHashToId.get(String(m.job_hash));
			if (!jobId) {
				throw new Error(`Job ID not found for hash: ${m.job_hash}`);
			}

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

		// FIX: Check if matches already exist for this user before inserting
		// This prevents unique constraint violations on duplicate requests
		const existingMatchCount = matchesToSave.length > 0 ? matchesToSave.length : 0;
		
		if (existingMatchCount > 0) {
			console.log(`${LOG_MARKERS.MATCHING_FREE} Checking for existing matches before insert`, {
				email: userPrefs.email,
				userId,
				matchesToInsert: matchesToSave.length,
			});

			// Get list of job_ids we're trying to insert
			const jobIdsToCheck = matchesToSave.map(m => m.job_id);
			
			// Check which matches already exist
			const { data: existingMatches, error: checkError } = await supabase
				.from("user_matches")
				.select("job_id")
				.eq("user_id", userId)
				.in("job_id", jobIdsToCheck);

			if (checkError) {
				console.warn(`${LOG_MARKERS.MATCHING_FREE} Error checking existing matches, proceeding with insert`, {
					email: userPrefs.email,
					userId,
					error: checkError.message,
				});
			} else if (existingMatches && existingMatches.length > 0) {
				// Filter out matches that already exist
				const existingJobIds = new Set(existingMatches.map(m => m.job_id));
				const newMatches = matchesToSave.filter(m => !existingJobIds.has(m.job_id));
				
				console.log(`${LOG_MARKERS.MATCHING_FREE} Filtered duplicate matches`, {
					email: userPrefs.email,
					userId,
					original: matchesToSave.length,
					existing: existingMatches.length,
					new: newMatches.length,
				});

				if (newMatches.length === 0) {
					// All matches already exist - this is idempotent, just succeed
					console.log(`${LOG_MARKERS.MATCHING_FREE} All matches already exist (idempotent request)`, {
						email: userPrefs.email,
						userId,
						matchCount: matchesToSave.length,
					});
					apiLogger.info("[FREE] All matches already exist - idempotent request", {
						email: userPrefs.email,
						matchCount: matchesToSave.length,
					});
					// Skip the insert and return success
					return {
						matches,
						matchCount: matches.length,
						method: method,
						duration: Date.now() - startTime,
					};
				}

				// Only insert new matches
				matchesToSave = newMatches;
			}
		}

	// FIX: Add retry logic for foreign key and unique constraint errors
	// This handles:
	// 1. Race conditions where user creation hasn't fully committed (FK errors)
	// 2. Duplicate requests trying to save same matches (unique constraint errors)
	const maxRetries = 3;
	const retryDelay = 500; // Start with 500ms
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		if (attempt > 0) {
			// Wait before retry with exponential backoff
			const delay = retryDelay * Math.pow(2, attempt - 1);
			console.log(`${LOG_MARKERS.MATCHING_FREE} Retrying match save (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
			await new Promise(resolve => setTimeout(resolve, delay));

			// Re-verify user exists before retry
			const { data: retryUserCheck, error: retryCheckError } = await supabase
				.from("users")
				.select("id")
				.eq("id", userId)
				.single();

			if (retryCheckError || !retryUserCheck) {
				throw new Error(
					`User verification failed on retry ${attempt + 1}: user_id ${userId} does not exist. ${retryCheckError?.message || 'User not found'}`
				);
			}
		}

		const { error } = await supabase.from("user_matches").insert(matchesToSave);

		if (!error) {
			// Success - break out of retry loop
			break;
		}

		// Check error type
		const isForeignKeyError = error.code === '23503' || error.message?.includes('foreign key constraint');
		const isUniqueConstraintError = error.code === '23505' || error.message?.includes('user_matches_unique');
		
		if (isUniqueConstraintError) {
			// Unique constraint error - matches likely already exist
			// This is OK for idempotent requests - just log and continue
			console.log(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_ERROR} Unique constraint error (likely duplicate request)`, {
				email: userPrefs.email,
				userId,
				matchCount: matchesToSave.length,
				errorMessage: error.message,
			});
			apiLogger.info("[FREE] Unique constraint error - matches likely already saved (idempotent)", {
				email: userPrefs.email,
				userId,
				matchCount: matchesToSave.length,
			});
			// Treat as success - matches are already saved
			break;
		}
		
		if (isForeignKeyError && attempt < maxRetries - 1) {
			// Foreign key error - will retry
			lastError = new Error(
				`Foreign key constraint violation (attempt ${attempt + 1}/${maxRetries}): user_id ${userId} for email ${userPrefs.email}. ` +
				`This constraint references public.users(id). ` +
				`Original error: ${error.message}`
			);
			console.warn(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_ERROR} FK constraint error, will retry`, {
				email: userPrefs.email,
				userId,
				attempt: attempt + 1,
				maxRetries,
			});
			continue;
		}

		// Non-FK/unique error or max retries reached
		if (isForeignKeyError) {
			const errorMessage = `Foreign key constraint violation after ${maxRetries} attempts: user_id ${userId} for email ${userPrefs.email}. ` +
				`This constraint references public.users(id). ` +
				`Original error: ${error.message}`;
			throw new Error(errorMessage);
		}
		
		throw new Error(`Failed to save matches: ${error.message}`);
	}

	if (lastError && !matchesToSave.length) {
		// If we exhausted retries and still have an error
		throw lastError;
	}

		console.log(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_SUCCESS} Successfully saved matches`, {
			email: userPrefs.email,
			count: matchesToSave.length,
		});
		apiLogger.info("[FREE] Successfully saved matches", {
			email: userPrefs.email,
			count: matchesToSave.length,
		});
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		
		console.error(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_ERROR} Error saving matches`, {
			email: userPrefs.email,
			matchCount: matches.length,
			error: error.message,
			stack: error.stack,
		});
		apiLogger.error("[FREE] Error saving matches", error, {
			email: userPrefs.email,
			matchCount: matches.length,
		});

		// CRITICAL: Capture to Sentry with full context
		Sentry.captureException(error, {
			tags: {
				service: "FreeMatchingStrategy",
				method: "saveMatchesAndReturn",
				tier: "free",
				operation: "database_save",
			},
			extra: {
				email: userPrefs.email,
				matchCount: matches.length,
				user_id: userPrefs.user_id,
				method: method,
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		// CRITICAL: Re-throw error so it propagates up and gets caught by parent handlers
		throw error;
	}

	return {
		matches,
		matchCount: matches.length,
		method: method,
		duration: Date.now() - startTime,
	};
}
