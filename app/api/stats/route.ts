// Public stats API for landing page
// Returns active job count and other public metrics

import { type NextRequest, NextResponse } from "next/server";
import { createSuccessResponse } from "../../../lib/api-response";
import { asyncHandler, AppError } from "../../../lib/errors";
import { apiLogger } from "../../../lib/api-logger";
import { getDatabaseClient } from "../../../utils/core/database-pool";
import type { StatsCache } from "../../../lib/stats-types";

// Helper to get requestId from request
function getRequestId(req: NextRequest): string {
	const headerVal = req.headers.get("x-request-id");
	if (headerVal && headerVal.length > 0) {
		return headerVal;
	}
	try {
		// eslint-disable-next-line
		const nodeCrypto = require("node:crypto");
		return nodeCrypto.randomUUID
			? nodeCrypto.randomUUID()
			: nodeCrypto.randomBytes(16).toString("hex");
	} catch {
		return Math.random().toString(36).slice(2) + Date.now().toString(36);
	}
}

// Cache stats for 1 hour

let cachedStats: StatsCache | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export const GET = asyncHandler(async (req: NextRequest) => {
	const requestId = getRequestId(req);
	const now = Date.now();
	const url = new URL(req.url);
	const type = url.searchParams.get("type") || "overview"; // overview, signups, eu-jobs

	// Handle different stats types
	switch (type) {
		case "signups":
			return handleSignupStats(requestId);
		case "eu-jobs": {
			const forceRefresh = url.searchParams.get("refresh") === "true";
			return handleEUJobStats(requestId, forceRefresh);
		}
		default:
			// Default overview stats
			break;
	}

	// Return cached stats if still valid
	if (cachedStats && now - lastFetch < CACHE_DURATION) {
		const successResponse = createSuccessResponse(
			{
				...cachedStats,
				cached: true,
				cacheAge: Math.floor((now - lastFetch) / 1000 / 60), // minutes
			},
			undefined,
			undefined,
			200,
		);
		const response = NextResponse.json(successResponse, { status: 200 });
		response.headers.set("x-request-id", requestId);
		return response;
	}

	// Fetch fresh stats
	const supabase = getDatabaseClient();

	// Get active job count (using id for count-only query)
	const { count: activeJobs, error: jobsError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true);

	if (jobsError) {
		apiLogger.error("Error fetching job stats", jobsError, {
			endpoint: "/api/stats",
			query: "activeJobs",
		});
		// Return cached stats if available, otherwise return safe defaults
		if (cachedStats) {
			return NextResponse.json(
				createSuccessResponse(
					{
						...cachedStats,
						cached: true,
						error: "Using cached data due to database error",
					},
					undefined,
					undefined,
					200,
				),
				{ status: 200 },
			);
		}
		throw new AppError(
			"Failed to fetch job stats",
			500,
			"DATABASE_ERROR",
			jobsError,
		);
	}

	// Get internship count (with error handling)
	const { count: internships, error: internshipsError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("is_internship", true);
	if (internshipsError) {
		apiLogger.warn("Error fetching internships count", internshipsError, {
			endpoint: "/api/stats",
			query: "internships",
		});
	}

	// Get graduate program count (with error handling)
	const { count: graduates, error: graduatesError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("is_graduate", true);
	if (graduatesError) {
		apiLogger.warn("Error fetching graduates count", graduatesError, {
			endpoint: "/api/stats",
			query: "graduates",
		});
	}

	// Get early career count (entry-level roles that aren't internships or graduate programs)
	// Use try-catch for contains query which might fail
	let earlyCareer = 0;
	try {
		const { count, error: earlyCareerError } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true)
			.contains("categories", ["early-career"])
			.eq("is_internship", false)
			.eq("is_graduate", false);
		if (earlyCareerError) {
			apiLogger.warn("Error fetching early career count", earlyCareerError, {
				endpoint: "/api/stats",
				query: "earlyCareer",
			});
		} else {
			earlyCareer = count || 0;
		}
	} catch (error) {
		apiLogger.error("Error fetching early career count", error as Error, {
			endpoint: "/api/stats",
			query: "earlyCareer",
		});
		earlyCareer = 0;
	}

	// Get weekly new jobs (jobs created in last 7 days, early-career only)
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	const oneWeekAgoISO = oneWeekAgo.toISOString();

	// Count early-career jobs created in last week
	// This includes internships, graduate programs, and early-career categorized jobs
	let weeklyNewJobs = 0;
	try {
		const { count, error: weeklyError } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true)
			.gte("created_at", oneWeekAgoISO)
			.or("is_internship.eq.true,is_graduate.eq.true");
		if (weeklyError) {
			apiLogger.warn("Error fetching weekly new jobs", weeklyError, {
				endpoint: "/api/stats",
				query: "weeklyNewJobs",
			});
		} else {
			weeklyNewJobs = count || 0;
		}
	} catch (error) {
		apiLogger.error("Error fetching weekly new jobs", error as Error, {
			endpoint: "/api/stats",
			query: "weeklyNewJobs",
		});
		weeklyNewJobs = 0;
	}

	// Get user count for social proof (with error handling)
	const { count: totalUsers, error: usersError } = await supabase
		.from("users")
		.select("id", { count: "exact", head: true })
		.eq("active", true);
	if (usersError) {
		apiLogger.warn("Error fetching users count", usersError, {
			endpoint: "/api/stats",
			query: "totalUsers",
		});
	}

	// Format numbers with commas
	const formatNumber = (num: number) => {
		return num.toLocaleString("en-US");
	};

	cachedStats = {
		activeJobs: activeJobs || 0,
		activeJobsFormatted: formatNumber(activeJobs || 0),
		internships: internships || 0,
		graduates: graduates || 0,
		earlyCareer: earlyCareer || 0,
		weeklyNewJobs: weeklyNewJobs || 0,
		weeklyNewJobsFormatted: formatNumber(weeklyNewJobs || 0),
		totalUsers: totalUsers || 0,
		totalUsersFormatted: formatNumber(totalUsers || 0),
		lastUpdated: new Date().toISOString(),
	};

	lastFetch = now;

	const successResponse = createSuccessResponse(
		{
			...cachedStats,
			cached: false,
		},
		undefined,
		undefined,
		200,
	);

	const response = NextResponse.json(successResponse, { status: 200 });
	response.headers.set("x-request-id", requestId);
	return response;
});

// Consolidated signup stats handler
async function handleSignupStats(requestId: string) {
	const now = Date.now();

	// Return cached count if still valid (1 minute cache)
	if (
		cachedSignupCount !== null &&
		now - lastSignupFetch < SIGNUP_CACHE_DURATION
	) {
		const successResponse = createSuccessResponse(
			{
				count: cachedSignupCount,
				cached: true,
				cacheAge: Math.floor((now - lastSignupFetch) / 1000), // seconds
			},
			undefined,
			undefined,
			200,
		);
		const response = NextResponse.json(successResponse, { status: 200 });
		response.headers.set("x-request-id", requestId);
		response.headers.set(
			"Cache-Control",
			"public, s-maxage=60, stale-while-revalidate=120",
		);
		return response;
	}

	// Fetch fresh count
	const supabase = getDatabaseClient();

	const { count, error } = await supabase
		.from("users")
		.select("id", { count: "exact", head: true })
		.eq("active", true);

	if (error) {
		throw new AppError(
			"Failed to fetch signup count",
			500,
			"DATABASE_ERROR",
			error,
		);
	}

	cachedSignupCount = count || 0;
	lastSignupFetch = now;

	const successResponse = createSuccessResponse(
		{
			count: cachedSignupCount,
			cached: false,
		},
		undefined,
		undefined,
		200,
	);

	const response = NextResponse.json(successResponse, { status: 200 });
	response.headers.set("x-request-id", requestId);
	response.headers.set(
		"Cache-Control",
		"public, s-maxage=60, stale-while-revalidate=120",
	);
	return response;
}

// Cache for EU job stats (5-minute cache for performance, but always try fresh first)
let cachedEUStats: {
	internships: number;
	graduateRoles: number;
	earlyCareer: number;
	total: number;
	cities: number;
	timestamp: string;
} | null = null;
let lastEUStatsFetch: number = 0;
const EU_STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - short cache for performance only

// Consolidated EU jobs stats handler - always fetches fresh data
async function handleEUJobStats(requestId: string, forceRefresh = false) {
	const now = Date.now();

	// Only use cache as fallback if fresh fetch fails AND cache exists AND cache is not zeros
	const useCacheAsFallback = 
		!forceRefresh &&
		cachedEUStats &&
		now - lastEUStatsFetch < EU_STATS_CACHE_DURATION &&
		cachedEUStats.total > 0; // Only use cache if it has real data

	apiLogger.info("Fetching fresh EU stats from database");
	const supabase = getDatabaseClient();

	// Get internship count - ALWAYS fetch fresh
	const { count: internships, error: internshipsError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("is_internship", true);

	if (internshipsError) {
		apiLogger.error("Error fetching EU internships count", internshipsError, {
			endpoint: "/api/stats",
			query: "euInternships",
			error: internshipsError.message,
		});
		// Only fall back to cache if it has real data (not zeros)
		if (useCacheAsFallback && cachedEUStats && cachedEUStats.total > 0) {
			apiLogger.warn("Using cached EU stats due to internships query error");
			const response = createSuccessResponse(
				{
					...cachedEUStats,
					cached: true,
					error: "Using cached data due to query error",
				},
				undefined,
				undefined,
				200,
			);
			response.headers.set("x-request-id", requestId);
			return response;
		}
		throw new AppError(
			"Failed to fetch EU job stats",
			500,
			"DATABASE_ERROR",
			internshipsError,
		);
	}

	// Get graduate roles count - ALWAYS fetch fresh
	const { count: graduateRoles, error: graduatesError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("is_graduate", true);

	if (graduatesError) {
		apiLogger.error("Error fetching EU graduate roles count", graduatesError, {
			endpoint: "/api/stats",
			query: "euGraduates",
			error: graduatesError.message,
		});
		// Only fall back to cache if it has real data (not zeros)
		if (useCacheAsFallback && cachedEUStats && cachedEUStats.total > 0) {
			apiLogger.warn("Using cached EU stats due to graduates query error");
			const response = createSuccessResponse(
				{
					...cachedEUStats,
					cached: true,
					error: "Using cached data due to query error",
				},
				undefined,
				undefined,
				200,
			);
			response.headers.set("x-request-id", requestId);
			return response;
		}
		throw new AppError(
			"Failed to fetch EU job stats",
			500,
			"DATABASE_ERROR",
			graduatesError,
		);
	}

	// Get early career count - use is_early_career boolean field
	let earlyCareer = 0;
	try {
		const { count, error: earlyCareerError } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true)
			.eq("is_early_career", true)
			.eq("is_internship", false)
			.eq("is_graduate", false);

		if (earlyCareerError) {
			apiLogger.warn("Error fetching EU early career count", earlyCareerError, {
				endpoint: "/api/stats",
				query: "euEarlyCareer",
			});
		} else {
			earlyCareer = count || 0;
		}
	} catch (error) {
		apiLogger.error("Error fetching EU early career count", error as Error, {
			endpoint: "/api/stats",
			query: "euEarlyCareer",
		});
		earlyCareer = 0;
	}

	// Get total active jobs count
	const { count: total, error: totalError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true);

	if (totalError) {
		apiLogger.error("Error fetching total jobs count", totalError, {
			endpoint: "/api/stats",
			query: "euTotalJobs",
		});
		throw new AppError(
			"Failed to fetch EU job stats",
			500,
			"DATABASE_ERROR",
			totalError,
		);
	}

	// Get distinct cities count - use a small select to get unique values
	const { data: cityData, error: citiesError } = await supabase
		.from("jobs")
		.select("city", { count: "exact", head: false })
		.eq("is_active", true)
		.not("city", "is", null);

	if (citiesError) {
		apiLogger.warn("Error fetching cities data", citiesError, {
			endpoint: "/api/stats",
			query: "euCities",
		});
	}

	// Get unique cities count
	const uniqueCities = new Set(cityData?.map((j) => j.city) || []);
	const citiesCount = uniqueCities.size;

	// Ensure we have valid counts (not null/undefined)
	const finalInternships = internships ?? 0;
	const finalGraduates = graduateRoles ?? 0;
	const finalTotal = total ?? 0;

	// Only cache if we got real data (not all zeros)
	const hasRealData = finalTotal > 0 || finalInternships > 0 || finalGraduates > 0 || earlyCareer > 0;

	if (hasRealData) {
		cachedEUStats = {
			internships: finalInternships,
			graduateRoles: finalGraduates,
			earlyCareer: earlyCareer,
			total: finalTotal,
			cities: citiesCount,
			timestamp: new Date().toISOString(),
		};
		lastEUStatsFetch = now;
	} else {
		// Don't cache zeros - log warning and use cached data if available
		apiLogger.warn(
			"⚠️ Database returned all zeros - not caching. Check database connection and RLS policies.",
			{
				internships,
				graduateRoles,
				earlyCareer,
				total,
				hasCachedData: !!cachedEUStats,
				cachedTotal: cachedEUStats?.total,
			},
		);
		
		// If we have cached data with real numbers, use it instead of zeros
		if (cachedEUStats && cachedEUStats.total > 0) {
			apiLogger.warn("Using cached EU stats instead of zeros");
			const response = createSuccessResponse(
				{
					...cachedEUStats,
					cached: true,
					warning: "Using cached data - fresh query returned zeros",
				},
				undefined,
				undefined,
				200,
			);
			response.headers.set("x-request-id", requestId);
			return response;
		}
	}

	const statsToReturn = cachedEUStats || {
		internships: finalInternships,
		graduateRoles: finalGraduates,
		earlyCareer: earlyCareer,
		total: finalTotal,
		cities: citiesCount,
		timestamp: new Date().toISOString(),
	};

	apiLogger.info("Returning EU stats", {
		internships: statsToReturn.internships,
		graduateRoles: statsToReturn.graduateRoles,
		earlyCareer: statsToReturn.earlyCareer,
		total: statsToReturn.total,
		cities: statsToReturn.cities,
		cached: !hasRealData && !!cachedEUStats,
		fresh: hasRealData,
	});

	const response = createSuccessResponse(
		{
			...statsToReturn,
			cached: !hasRealData && !!cachedEUStats,
		},
		undefined,
		undefined,
		200,
	);

	response.headers.set("x-request-id", requestId);
	// Short cache - 5 minutes max, always revalidate
	response.headers.set(
		"Cache-Control",
		"public, s-maxage=300, stale-while-revalidate=600",
	);
	return response;
}

// Cache for signup stats (separate from main stats cache)
let cachedSignupCount: number | null = null;
let lastSignupFetch: number = 0;
const SIGNUP_CACHE_DURATION = 60 * 1000; // 1 minute
