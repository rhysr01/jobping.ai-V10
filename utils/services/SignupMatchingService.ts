/**
 * SignupMatchingService - Consolidated Matching Logic for Both Free & Premium Signup
 *
 * This service eliminates code duplication between /api/signup and /api/signup/free routes.
 * It provides a single source of truth for all signup matching logic with tier-aware configurations.
 *
 * Key Features:
 * - Prevents race conditions via idempotency checks
 * - Tier-specific matching (5 matches for free, 15 for premium)
 * - Job freshness handling (free: 30 days, premium: 7 days)
 * - Comprehensive logging and error handling
 */

import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../lib/api-logger";
import { getDatabaseClient } from "../core/database-pool";
import type { JobMatch, UserPreferences } from "../matching/types";
import {
	type FreeUserPreferences,
	runFreeMatching,
} from "../strategies/FreeMatchingStrategy";
import {
	type PremiumUserPreferences,
	runPremiumMatching,
} from "../strategies/PremiumMatchingStrategy";

export type SubscriptionTier = "free" | "premium_pending";

export interface MatchingConfig {
	tier: SubscriptionTier;
	maxMatches: number;
	jobFreshnessDays: number;
	useAI: boolean;
	maxJobsForAI: number;
	fallbackThreshold: number;
	includePrefilterScore: boolean;
	maxJobsToFetch: number; // CRITICAL: Prevent fetching massive job pools
}

export interface MatchingResult {
	success: boolean;
	matchCount: number;
	matches: JobMatch[];
	processingTime: number;
	method: "ai" | "fallback" | "idempotent";
	error?: string;
}

/**
 * Centralized tier configurations - no more magic numbers scattered across routes
 */
const TIER_CONFIGS: Record<SubscriptionTier, MatchingConfig> = {
	free: {
		tier: "free",
		maxMatches: 5, // Free users get 5 matches
		jobFreshnessDays: 30, // Free users get 30-day old jobs
		useAI: true,
		maxJobsForAI: 20,
		fallbackThreshold: 3,
		includePrefilterScore: true,
		maxJobsToFetch: 5000, // Prevent massive DB scans for free tier
	},
	premium_pending: {
		tier: "premium_pending",
		maxMatches: 15, // Premium users get 15 matches
		jobFreshnessDays: 7, // Premium users get 7-day old jobs
		useAI: true,
		maxJobsForAI: 30,
		fallbackThreshold: 5,
		includePrefilterScore: true,
		maxJobsToFetch: 10000, // Premium gets fresher jobs, so larger pool ok
	},
};

export class SignupMatchingService {
	/**
	 * Get tier-specific matching configuration
	 */
	static getConfig(tier: SubscriptionTier): MatchingConfig {
		const config = TIER_CONFIGS[tier];
		if (!config) {
			throw new Error(`Invalid subscription tier: ${tier}`);
		}
		return config;
	}

	/**
	 * Main matching method - delegates to appropriate strategy based on tier
	 */
	static async runMatching(
		userPrefs: UserPreferences,
		config: MatchingConfig,
		requestId?: string,
	): Promise<MatchingResult> {
		const startTime = Date.now();
		const email = userPrefs.email;
		const requestIdStr = requestId || randomUUID();

		try {
			apiLogger.info(
				`[${config.tier.toUpperCase()}] Starting signup matching`,
				{
					email,
					requestId: requestIdStr,
					tier: config.tier,
					maxMatches: config.maxMatches,
					jobFreshnessDays: config.jobFreshnessDays,
				},
			);

			// STEP 1: IDEMPOTENCY CHECK - Prevent race conditions
			const existingMatchesResult =
				await SignupMatchingService.checkExistingMatches(email, config.tier);
			if (existingMatchesResult) {
				const processingTime = Date.now() - startTime;
				apiLogger.info(
					`[${config.tier.toUpperCase()}] Idempotent match found`,
					{
						email,
						requestId: requestIdStr,
						existingCount: existingMatchesResult.matchCount,
						processingTime,
					},
				);
				return {
					success: true,
					matchCount: existingMatchesResult.matchCount,
					matches: [],
					processingTime,
					method: "idempotent",
				};
			}

			// STEP 2: FETCH JOBS - Tier-aware job selection with user context
			let jobs: any[];
			try {
				jobs = await SignupMatchingService.fetchJobsForTier(config, userPrefs);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				apiLogger.error(
					`[${config.tier.toUpperCase()}] Failed to fetch jobs for matching`,
					error instanceof Error ? error : new Error(errorMessage),
					{
						email,
						requestId: requestIdStr,
						tier: config.tier,
					},
				);

				// Capture in Sentry with user context
				Sentry.captureException(error instanceof Error ? error : new Error(errorMessage), {
					tags: {
						service: "SignupMatchingService",
						method: "runMatching",
						tier: config.tier,
						step: "fetch_jobs",
					},
					extra: {
						email,
						requestId: requestIdStr,
						tier: config.tier,
						jobFreshnessDays: config.jobFreshnessDays,
					},
					user: { email },
					level: "error",
				});

				return {
					success: false,
					matchCount: 0,
					matches: [],
					processingTime: Date.now() - startTime,
					method: "ai",
					error: "DATABASE_ERROR",
				};
			}

			if (jobs.length === 0) {
				apiLogger.warn(
					`[${config.tier.toUpperCase()}] No jobs available for matching`,
					{
						email,
						requestId: requestIdStr,
						tier: config.tier,
					},
				);
				return {
					success: false,
					matchCount: 0,
					matches: [],
					processingTime: Date.now() - startTime,
					method: "ai",
					error: "NO_JOBS_AVAILABLE",
				};
			}

			apiLogger.info(
				`[${config.tier.toUpperCase()}] Fetched jobs for matching`,
				{
					email,
					requestId: requestIdStr,
					jobCount: jobs.length,
					tier: config.tier,
				},
			);

			// STEP 3: DELEGATE TO APPROPRIATE STRATEGY
			let strategyResult: {
				matches: any[];
				matchCount: number;
				method: string;
				duration: number;
			};

			if (config.tier === "free") {
				// Use Free Matching Strategy
				// FREE form only provides: email, cities, careerPath (NO visa, entry_level, skills, etc)
				const freePrefs: FreeUserPreferences = {
					email: userPrefs.email,
					target_cities: userPrefs.target_cities || [],
					career_path: userPrefs.career_path?.[0] || null,
					subscription_tier: "free",
				};

				strategyResult = await runFreeMatching(
					freePrefs,
					jobs,
					config.maxMatches,
				);
			} else {
				// Use Premium Matching Strategy
				// PREMIUM ONLY USES FIELDS WITH FULL DB SUPPORT + VISA_STATUS
				// Removed unsupported fields: company_types, skills, industries, roles,
				// company_size_preference, career_keywords (no job DB data)
				// Kept: visa_status (1.7% coverage) per user request
				const premiumPrefs: PremiumUserPreferences = {
					// From form Step 1 & 2
					email: userPrefs.email,
					user_id: userPrefs.user_id, // Add user_id for proper FK relationships
					target_cities: userPrefs.target_cities || [],
					career_path: userPrefs.career_path || [],

					// From form Step 3 (DB-supported + visa_status)
					languages_spoken: userPrefs.languages_spoken || [],
					entry_level_preference: userPrefs.entry_level_preference,
					work_environment: userPrefs.work_environment,
					visa_status: userPrefs.visa_status,

					// Set by service
					subscription_tier: "premium_pending",
				};

				strategyResult = await runPremiumMatching(
					premiumPrefs,
					jobs,
					config.maxMatches,
				);
			}

			const processingTime = Date.now() - startTime;

			apiLogger.info(
				`[${config.tier.toUpperCase()}] Strategy matching completed`,
				{
					email,
					requestId: requestIdStr,
					tier: config.tier,
					totalJobsProcessed: jobs.length,
					matchesFound: strategyResult.matchCount,
					processingTime,
					method: strategyResult.method,
				},
			);

			return {
				success: true,
				matchCount: strategyResult.matchCount,
				matches: strategyResult.matches,
				processingTime,
				method: strategyResult.method as "ai" | "fallback" | "idempotent",
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			apiLogger.error(
				`[${config.tier.toUpperCase()}] Matching failed catastrophically`,
				error as Error,
				{
					email,
					requestId: requestIdStr,
					tier: config.tier,
					processingTime,
					error: errorMessage,
				},
			);

			return {
				success: false,
				matchCount: 0,
				matches: [],
				processingTime,
				method: "ai",
				error: errorMessage,
			};
		}
	}

	/**
	 * Check if user already has matches (idempotency)
	 */
	private static async checkExistingMatches(
		email: string,
		tier: SubscriptionTier,
	): Promise<{ matchCount: number } | null> {
		try {
			const supabase = getDatabaseClient();

			// First get the user_id from email
			const { data: user } = await supabase
				.from("users")
				.select("id")
				.eq("email", email)
				.single();

			if (!user) {
				return null; // User doesn't exist, no matches possible
			}

			// Check if matches already exist
			const { data: existingMatches } = await supabase
				.from("user_matches")
				.select("job_id")
				.eq("user_id", user.id)
				.limit(1);

			if (existingMatches && existingMatches.length > 0) {
				// Get actual count
				const { count: matchCount } = await supabase
					.from("user_matches")
					.select("id", { count: "exact", head: true })
					.eq("user_id", user.id);

				return { matchCount: matchCount || 0 };
			}

			return null; // No existing matches
		} catch (error) {
			apiLogger.warn(
				`[${tier.toUpperCase()}] Failed to check existing matches, proceeding with matching`,
				{
					email,
					error: error instanceof Error ? error.message : String(error),
				},
			);
			return null; // Proceed with matching on error
		}
	}

	/**
	 * Fetch jobs based on tier-specific freshness requirements
	 * CRITICAL: Database-level limit prevents massive job pool bloat
	 * FIX: Handle null posted_at values using or() to prevent 500 errors
	 * FIX: Add proper error handling for Supabase query failures
	 */
	private static async fetchJobsForTier(
		config: MatchingConfig,
		userPrefs?: UserPreferences,
	): Promise<any[]> {
		const supabase = getDatabaseClient();
		const freshnessDate = new Date();
		freshnessDate.setDate(freshnessDate.getDate() - config.jobFreshnessDays);

		try {
			let query = supabase
				.from("jobs")
				.select(`
				id, job_hash, title, company, location, city, country, job_url, description,
				experience_required, work_environment, source, categories,
				language_requirements, scrape_timestamp, original_posted_date, posted_at,
				last_seen_at, is_active, created_at, is_internship, is_graduate,
				visa_friendly, visa_sponsored, status, filtered_reason
			`)
				.eq("is_active", true)
				.eq("status", "active")
				.is("filtered_reason", null)
				.or(`posted_at.gte.${freshnessDate.toISOString()},posted_at.is.null`);

			// Add city filtering for free tier users
			if (userPrefs?.subscription_tier === "free" && userPrefs.target_cities && userPrefs.target_cities.length > 0) {
				// Create city variations (handle case differences)
				const cityVariations = new Set<string>();
				userPrefs.target_cities.forEach(city => {
					cityVariations.add(city); // Original case
					cityVariations.add(city.toLowerCase()); // Lowercase
					cityVariations.add(city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()); // Capitalized
				});
				
				const citiesArray = Array.from(cityVariations);
				query = query.in("city", citiesArray);
				
				apiLogger.info("SignupMatchingService - city filter applied at DB level", {
					tier: config.tier,
					targetCities: userPrefs.target_cities,
					citiesArray,
				});
			}

			const { data: jobs, error } = await query
				.order("created_at", { ascending: false })
				.limit(config.maxJobsToFetch); // PRODUCTION FIX: Prevent massive DB scans

			if (error) {
				const errorDetails = {
					tier: config.tier,
					error: error.message,
					errorCode: error.code,
					freshnessDate: freshnessDate.toISOString(),
					jobFreshnessDays: config.jobFreshnessDays,
					query: `posted_at.gte.${freshnessDate.toISOString()},posted_at.is.null`,
				};

				apiLogger.error("Database error fetching jobs for tier", new Error(error.message), errorDetails);
				
				// Capture in Sentry with detailed context
				Sentry.captureException(new Error(`Database query failed: ${error.message}`), {
					tags: {
						service: "SignupMatchingService",
						method: "fetchJobsForTier",
						tier: config.tier,
						errorCode: error.code,
					},
					extra: errorDetails,
					level: "error",
				});

				throw new Error(`Database query failed: ${error.message}`);
			}

			return jobs || [];
		} catch (error) {
			const errorDetails = {
				tier: config.tier,
				error: error instanceof Error ? error.message : String(error),
				freshnessDate: freshnessDate.toISOString(),
				jobFreshnessDays: config.jobFreshnessDays,
			};

			apiLogger.error("Failed to fetch jobs for tier", error instanceof Error ? error : new Error(String(error)), errorDetails);
			
			// Capture in Sentry if not already captured
			if (!(error instanceof Error && error.message.includes("Database query failed"))) {
				Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
					tags: {
						service: "SignupMatchingService",
						method: "fetchJobsForTier",
						tier: config.tier,
					},
					extra: errorDetails,
					level: "error",
				});
			}

			throw error;
		}
	}
}

/**
 * USAGE EXAMPLES:
 *
 * // In /api/signup/route.ts (premium):
 * import { SignupMatchingService } from "@/utils/services/SignupMatchingService";
 *
 * const matchingConfig = SignupMatchingService.getConfig("premium_pending");
 * const result = await SignupMatchingService.runMatching(userPrefs, matchingConfig);
 * const matchesCount = result.matchCount;
 *
 * // In /api/signup/free/route.ts (free):
 * const matchingConfig = SignupMatchingService.getConfig("free");
 * const result = await SignupMatchingService.runMatching(userPrefs, matchingConfig);
 * const matchesCount = result.matchCount;
 */
