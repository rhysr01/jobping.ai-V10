// File: /utils/strategies/FreeMatchingStrategy.ts
// Purpose: Simple matching strategy for free tier users (1-step form)
// Free users provide: email, name, cities, career only
// Result: 5 matches

import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../lib/api-logger";
import type { JobWithMetadata } from "../../lib/types/job";
import { getDatabaseClient } from "../core/database-pool";
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
		const aiResults = await aiMatchingService.findMatches(
			userForAI,
			jobs.slice(0, 20).map((j) => j as any),
		);

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
				return {
					...jobData,
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
			const fallbackMatches = jobs.slice(0, maxMatches).map((job: any) => ({
				...job,
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

		// Save matches to database - call existing save function
		return await saveMatchesAndReturn(userPrefs, matches, jobs, method, startTime, maxMatches);
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
		if (jobs.length > 0) {
			const fallbackMatches = jobs.slice(0, maxMatches).map((job: any) => ({
				...job,
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
 * Save matches to database and return result (extracted for reuse)
 */
async function saveMatchesAndReturn(
	userPrefs: FreeUserPreferences,
	matches: any[],
	_jobs: JobWithMetadata[],
	method: string,
	startTime: number,
	_maxMatches: number,
): Promise<MatchingResult> {
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
			
			apiLogger.info("[FREE] Looking up job IDs from hashes", {
				email: userPrefs.email,
				job_hashes: jobHashes,
				hash_count: jobHashes.length,
			});
			
			const { data: jobs, error: jobLookupError } = await supabase
				.from("jobs")
				.select("id, job_hash")
				.in("job_hash", jobHashes);

			if (jobLookupError) {
				apiLogger.error("[FREE] Job lookup error", jobLookupError as Error, {
					email: userPrefs.email,
					job_hashes: jobHashes,
				});
				throw new Error(`Job lookup failed: ${jobLookupError.message}`);
			}

			if (!jobs || jobs.length === 0) {
				apiLogger.error("[FREE] No jobs found for any hashes", new Error("No jobs found"), {
					email: userPrefs.email,
					job_hashes: jobHashes,
					matches_count: matches.length,
				});
				throw new Error(`No jobs found for hashes: ${jobHashes.join(", ")}`);
			}

			// Log the job lookup results
			apiLogger.info("[FREE] Job lookup results", {
				email: userPrefs.email,
				requested_hashes: jobHashes.length,
				found_jobs: jobs.length,
				found_hashes: jobs.map(j => j.job_hash),
				missing_hashes: jobHashes.filter(hash => !jobs.find(j => j.job_hash === hash)),
			});

			// Create lookup map for job_hash -> job_id
			const jobHashToId = new Map(jobs.map(job => [job.job_hash, job.id]));

			matchesToSave = matches.map((m: any) => {
				const jobId = jobHashToId.get(String(m.job_hash));
				if (!jobId) {
					apiLogger.error("[FREE] Job ID not found for hash", new Error("Missing job ID"), {
						email: userPrefs.email,
						job_hash: m.job_hash,
						available_hashes: Array.from(jobHashToId.keys()),
					});
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

			// Validate all matches before inserting
			const invalidMatches = matchesToSave.filter(match => !match.job_id || !match.user_id);
			if (invalidMatches.length > 0) {
				apiLogger.error("[FREE] Invalid matches detected", new Error("Invalid match data"), {
					email: userPrefs.email,
					invalid_matches: invalidMatches,
					total_matches: matchesToSave.length,
				});
				throw new Error(`${invalidMatches.length} matches have invalid job_id or user_id`);
			}

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
				all_job_ids: matchesToSave.map(m => m.job_id),
			});

			const { error } = await supabase.from("user_matches").insert(matchesToSave);

			if (error) {
				// Check if it's a foreign key constraint error
				const isForeignKeyError = error.code === '23503' || error.message?.includes('foreign key constraint');
				const isUserIdError = error.message?.includes('user_matches_user_id_fkey');
				const isJobIdError = error.message?.includes('user_matches_job_id_fkey');
				
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
						isUserIdError,
						isJobIdError,
						sampleMatch: matchesToSave[0],
						allJobIds: matchesToSave.map(m => m.job_id),
					},
				);

				if (isForeignKeyError) {
					if (isJobIdError) {
						// The actual constraint that exists - job_id foreign key
						const invalidJobIds = matchesToSave.map(m => m.job_id);
						apiLogger.error("[FREE] Job ID foreign key constraint violation", error as Error, {
							email: userPrefs.email,
							job_ids: invalidJobIds,
						});
						throw new Error(`Job ID foreign key constraint violation: One or more job_ids don't exist in jobs table. Job IDs: ${invalidJobIds.join(', ')}. Original error: ${error.message}`);
					} else if (isUserIdError) {
						// This constraint doesn't actually exist in the schema, but error message suggests it
						apiLogger.warn("[FREE] Misleading user_id foreign key error - this constraint doesn't exist in schema", {
							email: userPrefs.email,
							user_id: userId,
							error_code: error.code,
						});
						throw new Error(`Misleading user_id foreign key error: user_id ${userId} for email ${userPrefs.email}. This constraint doesn't exist in schema. Original error: ${error.message}`);
					} else {
						// Generic foreign key error
						throw new Error(`Foreign key constraint violation for email ${userPrefs.email}. Original error: ${error.message}`);
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
}
