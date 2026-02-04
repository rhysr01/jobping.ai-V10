// File: /utils/strategies/PremiumMatchingStrategy.ts
// Purpose: Complex matching strategy for premium tier users (simplified form)
// Premium users provide: cities, career, work env, visa, languages, etc.
// Result: 15 matches

import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../lib/api-logger";
import type { JobWithMetadata } from "../../lib/types/job";
import { aiMatchingService } from "../matching/core/ai-matching.service";
import { jobMatchesUserCategories } from "../matching/categoryMapper";
import { getDatabaseClient } from "../core/database-pool";
import { LOG_MARKERS } from "../../lib/log-markers";

export interface PremiumUserPreferences {
	// From form Step 1: Personal Info
	email: string;
	user_id?: string; // Required for proper FK to users table

	// From form Step 2: Geographic & Career
	target_cities: string[];
	career_path: string[];

	// From form Step 3: Preferences (only supported fields + visa_status)
	languages_spoken: string[];
	work_environment?: "remote" | "hybrid" | "on-site" | "unclear";
	entry_level_preference?: string;
	visa_status?: string;

	// Set by API (not from form)
	subscription_tier: "premium_pending";
}

export interface MatchingResult {
	matches: JobWithMetadata[];
	matchCount: number;
	method: string;
	duration: number;
}

/**
 * Premium Matching Strategy
 *
 * Complex matching for premium tier:
 * - Uses: All 17+ fields provided by comprehensive 4-step form
 * - Filtering: Cities + career + industries + work env + visa + languages
 * - AI Processing: Deep analysis (30 jobs max)
 * - Result: 15 matches with sophisticated ranking
 * - Logic: Thorough pre-filtering + deep AI ranking
 */
export async function runPremiumMatching(
	userPrefs: PremiumUserPreferences,
	jobs: JobWithMetadata[],
	maxMatches: number = 15,
): Promise<MatchingResult> {
	const startTime = Date.now();

	try {
		console.log(`${LOG_MARKERS.MATCHING_PREMIUM} ${LOG_MARKERS.MATCHING_START} Starting premium tier matching`, {
			email: userPrefs.email,
			cities: userPrefs.target_cities,
			careerPaths: userPrefs.career_path,
			jobsAvailable: jobs.length,
		});
		apiLogger.info("[PREMIUM] Starting premium tier matching", {
			email: userPrefs.email,
			cities: userPrefs.target_cities,
			careerPaths: userPrefs.career_path,
			jobsAvailable: jobs.length,
		});

		if (!jobs || jobs.length === 0) {
			apiLogger.warn("[PREMIUM] No jobs available for matching", {
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

		// STAGE 1: Comprehensive pre-filtering (premium users provide rich data)
		// This is the KEY difference from free - we filter THOROUGHLY because
		// Premium users provide: cities, career, work environment, visa status, languages, etc.
		const preFiltered = jobs.filter((job) => {
			// City matching (required) - use flexible matching for variations like "London" vs "Central London"
			const cityMatch = userPrefs.target_cities.some((userCity) => {
				const normalizedUserCity = userCity.toLowerCase().trim();
				const normalizedJobCity = job.city?.toLowerCase().trim() || "";
				// Allow partial matches for city names (e.g., "London" matches "Central London")
				return (
					normalizedJobCity === normalizedUserCity ||
					normalizedJobCity.includes(normalizedUserCity) ||
					normalizedUserCity.includes(normalizedJobCity)
				);
			});
			if (!cityMatch) return false;

			// Career path matching - uses proper database category mapping, not string matching
			const careerMatch = jobMatchesUserCategories(
				job.categories || [],
				userPrefs.career_path || [],
			);
			if (!careerMatch) return false;

			// Work environment matching
			const workEnvMatch =
				!userPrefs.work_environment ||
				userPrefs.work_environment === "unclear" ||
				job.work_environment === userPrefs.work_environment;
			if (!workEnvMatch) return false;

			// Visa status matching (if specified)
			const visaMatch =
				!userPrefs.visa_status || job.visa_sponsorship || job.visa_friendly;
			if (!visaMatch) return false;

			return true;
		});

		apiLogger.info("[PREMIUM] Pre-filtered jobs", {
			email: userPrefs.email,
			original: jobs.length,
			afterPreFilter: preFiltered.length,
			filtersApplied: {
				cities: userPrefs.target_cities.length,
				careers: userPrefs.career_path?.length || 0,
				workEnvironment: !!userPrefs.work_environment,
				visaStatus: !!userPrefs.visa_status,
			},
		});

		if (preFiltered.length === 0) {
			apiLogger.warn("[PREMIUM] No jobs after comprehensive pre-filtering", {
				email: userPrefs.email,
				reason:
					"Filters too restrictive - premium users have specific requirements",
			});

			// Fallback: Relax some constraints but keep core requirements
			const fallbackFiltered = jobs.filter((job) => {
				// Keep city and career as mandatory
				const cityMatch = userPrefs.target_cities.some((userCity) => {
					const normalizedUserCity = userCity.toLowerCase().trim();
					const normalizedJobCity = job.city?.toLowerCase().trim() || "";
					return (
						normalizedJobCity === normalizedUserCity ||
						normalizedJobCity.includes(normalizedUserCity) ||
						normalizedUserCity.includes(normalizedJobCity)
					);
				});
				const careerMatch = jobMatchesUserCategories(
					job.categories || [],
					userPrefs.career_path || [],
				);

				// Use relaxed work environment matching for recovery
				const workEnvMatch =
					!userPrefs.work_environment ||
					userPrefs.work_environment === "unclear" ||
					job.work_environment === userPrefs.work_environment;

				return cityMatch && careerMatch && workEnvMatch;
			});

			if (fallbackFiltered.length > 0) {
				apiLogger.info("[PREMIUM] Using fallback (relaxed industries)", {
					email: userPrefs.email,
					jobsInFallback: fallbackFiltered.length,
				});

				return await rankAndReturnMatchesDirect(
					userPrefs,
					fallbackFiltered,
					"premium_fallback",
					startTime,
					maxMatches,
				);
			}

			return {
				matches: [],
				matchCount: 0,
				method: "no_jobs_after_filter",
				duration: Date.now() - startTime,
			};
		}

		// STAGE 2: Deep AI ranking (premium gets thorough analysis)
		// CRITICAL FIX: Don't use SimplifiedMatchingEngine which does ANOTHER prefilter
		// Jobs are already filtered by city + careerPath + workEnv + visa, so use AI matching directly
		// For premium tier, we use DEEP AI because:
		// 1. Users have provided comprehensive data (17+ fields)
		// 2. Premium users expect high-quality matches
		// 3. 15 matches allows for sophisticated ranking
		// 4. We can afford heavier processing for paying users
		return await rankAndReturnMatchesDirect(
			userPrefs,
			preFiltered,
			"premium_ai_ranked",
			startTime,
			maxMatches,
		);
	} catch (error) {
		console.error(`${LOG_MARKERS.MATCHING_PREMIUM} ${LOG_MARKERS.MATCHING_ERROR} Matching error`, {
			email: userPrefs.email,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		apiLogger.error("[PREMIUM] Matching error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "PremiumMatchingStrategy",
				method: "runPremiumMatching",
				tier: "premium",
			},
			extra: {
				email: userPrefs.email,
				jobsCount: jobs.length,
				maxMatches,
				userPreferences: {
					target_cities: userPrefs.target_cities,
					career_path: userPrefs.career_path,
					languages_spoken: userPrefs.languages_spoken,
					work_environment: userPrefs.work_environment,
					visa_status: userPrefs.visa_status,
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
 * CRITICAL FIX: Jobs are already filtered by city + careerPath + workEnv + visa,
 * so don't prefilter again via SimplifiedMatchingEngine
 */
async function rankAndReturnMatchesDirect(
	userPrefs: PremiumUserPreferences,
	jobs: JobWithMetadata[],
	method: string,
	startTime: number,
	maxMatches: number,
): Promise<MatchingResult> {
	try {
		// Normalize jobs for consistent processing
		const normalizedJobs = jobs.map((job) => ({
			...job,
			language_requirements: job.language_requirements || [],
		}));

		// CRITICAL FIX: Use AI matching DIRECTLY without prefilter
		// Jobs are already filtered by city + careerPath + workEnv + visa in runPremiumMatching
		// Don't use SimplifiedMatchingEngine which does ANOTHER prefilter
		const aiResults = await aiMatchingService.findMatches(
			userPrefs as any,
			normalizedJobs.slice(0, 30).map((j) => j as any), // Premium gets more jobs for AI (30 vs 20 for free)
		);

		// Convert AI results to match format
		const matches = (aiResults || [])
			.slice(0, maxMatches)
			.map((m: any) => {
				const jobData = m.job || m;
				if (!jobData) {
					apiLogger.warn("[PREMIUM] Match missing job data", {
						email: userPrefs.email,
						match: m,
					});
					return null;
				}
				return {
					...jobData,
					match_score: m.unifiedScore?.overallScore || m.match_score || 0.8,
					match_reason: m.matchReason || m.match_reason || "Premium AI Match",
				};
			})
			.filter(Boolean);
		
		apiLogger.info("[PREMIUM] Direct AI ranking complete", {
			email: userPrefs.email,
			inputJobs: jobs.length,
			aiResults: aiResults.length,
			outputMatches: matches.length,
			method: method,
			duration: Date.now() - startTime,
		});

		// If no matches found, try fallback with filtered jobs
		if (matches.length === 0 && jobs.length > 0) {
			apiLogger.warn(
				"[PREMIUM] No matches from direct AI, using filtered job list as fallback",
				{
					email: userPrefs.email,
					filteredJobs: jobs.length,
				},
			);

			// Take top filtered jobs as fallback (already matched all premium criteria)
			const fallbackMatches = jobs.slice(0, maxMatches).map((job: any) => ({
				...job,
				match_score: 0.7, // Higher score since they passed all premium filters
				match_reason: "Matched your premium preferences (city, career, work environment, visa)",
			}));

			apiLogger.info("[PREMIUM] Using filtered fallback job list", {
				email: userPrefs.email,
				fallbackMatches: fallbackMatches.length,
			});

			return {
				matches: fallbackMatches,
				matchCount: fallbackMatches.length,
				method: "premium_fallback_filtered",
				duration: Date.now() - startTime,
			};
		}

		// Save premium matches to database
		const matchesToSave = matches.map((m: any) => {
			// Fix match score normalization - check range before dividing
			const rawScore = m.match_score || 0;
			const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;

			return {
				user_id: userPrefs.user_id, // ✅ FIXED #P6: Use user_id instead of user_email for proper FK
				job_id: m.id, // Link to jobs table via proper FK
				match_score: Number(normalizedScore),
				match_reason: String(m.match_reason || "Premium AI Match"),
				created_at: new Date().toISOString(),
				// Removed match_algorithm - column doesn't exist in user_matches table
			};
		});

	if (matchesToSave.length > 0) {
		try {
			const supabase = getDatabaseClient();
			
			// Verify user exists before inserting matches
			if (!userPrefs.user_id) {
				throw new Error(`user_id is required for premium matches but was not provided for email: ${userPrefs.email}`);
			}

			// Final verification: ensure user exists before inserting matches
			const { data: userCheck, error: userCheckError } = await supabase
				.from("users")
				.select("id")
				.eq("id", userPrefs.user_id)
				.single();

			if (userCheckError || !userCheck) {
				throw new Error(
					`User verification failed before saving matches: user_id ${userPrefs.user_id} for email ${userPrefs.email} does not exist. ${userCheckError?.message || 'User not found'}`,
				);
			}

			const { error } = await supabase.from("user_matches").insert(matchesToSave);

			if (error) {
				const isForeignKeyError = error.code === '23503' || error.message?.includes('foreign key constraint');
				const errorMessage = isForeignKeyError
					? `Foreign key constraint violation: user_id ${userPrefs.user_id} for email ${userPrefs.email}. This constraint references public.users(id). Original error: ${error.message}`
					: `Failed to save premium matches: ${error.message}`;

				apiLogger.error(
					"[PREMIUM] Failed to save matches to database",
					error as Error,
					{
						email: userPrefs.email,
						userId: userPrefs.user_id,
						matchCount: matchesToSave.length,
						errorCode: error.code,
						isForeignKeyError,
					},
				);

				// CRITICAL FIX: Propagate error instead of silently continuing
				throw new Error(errorMessage);
			} else {
				apiLogger.info("[PREMIUM] Successfully saved matches to database", {
					email: userPrefs.email,
					count: matchesToSave.length,
				});
			}
		} catch (err) {
			apiLogger.error("[PREMIUM] Error saving matches", err as Error, {
				email: userPrefs.email,
				userId: userPrefs.user_id,
				matchCount: matchesToSave.length,
			});

			// Capture in Sentry
			Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
				tags: {
					service: "PremiumMatchingStrategy",
					method: "saveMatches",
					tier: "premium",
				},
				extra: {
					email: userPrefs.email,
					matchCount: matchesToSave.length,
					operation: "database_save",
				},
				user: { email: userPrefs.email },
				level: "error",
			});

			throw err;
		}
	}

		return {
			matches,
			matchCount: matches.length,
			method: method,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		apiLogger.error("[PREMIUM] Deep AI ranking error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "PremiumMatchingStrategy",
				method: "deepAIRanking",
				tier: "premium",
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
