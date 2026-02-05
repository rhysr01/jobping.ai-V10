import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { asyncHandler } from "../../../../lib/errors";
import { apiLogger } from "../../../../lib/api-logger";
import { getDatabaseClient } from "../../../../utils/core/database-pool";
import { getProductionRateLimiter } from "../../../../utils/production-rate-limiter";

export const GET = asyncHandler(async (request: NextRequest) => {
	console.log("🔍 [FREE MATCHES] Request received", {
		url: request.url,
		method: request.method,
		cookieNames: Array.from(request.cookies.getAll().map(c => c.name)),
		timestamp: new Date().toISOString(),
	});

	// Set Sentry context for this request
	Sentry.setContext("request", {
		url: request.url,
		method: request.method,
		headers: {
			userAgent: request.headers.get("user-agent"),
			referer: request.headers.get("referer"),
		},
	});

	// Rate limiting - prevent abuse
	const rateLimitResult = await getProductionRateLimiter().middleware(
		request,
		"matches-free",
		{
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 30, // 30 requests per minute per IP (allows reasonable browsing)
		},
	);

	if (rateLimitResult) {
		return rateLimitResult;
	}

	// Get user email from unified cookie (set by signup API for all tiers)
	const cookies = request.cookies;
	const userEmail = cookies.get("user_email")?.value?.toLowerCase().trim();

	console.log("🍪 [FREE MATCHES] Cookie check", {
		hasUserEmailCookie: !!cookies.get("user_email"),
		userEmail: userEmail || 'undefined',
		allCookieNames: cookies.getAll().map(c => c.name),
	});

	if (!userEmail) {
		apiLogger.warn("Free matches accessed without cookie", {
			ip:
				request.headers.get("x-forwarded-for") ||
				request.headers.get("x-real-ip"),
			userAgent: request.headers.get("user-agent"),
		});
		return NextResponse.json(
			{
				error: "authentication_required",
				message: "Please sign up first to view your matches.",
			},
			{ status: 401 },
		);
	}

	const supabase = getDatabaseClient();

	// Verify user exists and is free tier
	console.log("👤 [FREE MATCHES] Looking up user", { userEmail });
	
	const { data: user, error: userLookupError } = await supabase
		.from("users")
		.select("id, subscription_tier, email")
		.ilike("email", userEmail)
		.maybeSingle();
		
	console.log("🔍 [FREE MATCHES] User lookup debug", {
		userEmail,
		user,
		userLookupError: userLookupError?.message || null,
		hasUser: !!user,
	});

	console.log("📊 [FREE MATCHES] User lookup result", {
		found: !!user,
		user: user ? { id: user.id, subscription_tier: user.subscription_tier, email: user.email } : null,
	});

	if (!user) {
		apiLogger.warn("Free matches - user not found", {
			email: userEmail,
		});

		// Capture in Sentry - this could indicate a data integrity issue
		Sentry.captureMessage("Free matches - user not found", {
			level: "warning",
			tags: {
				service: "matches-free",
				error_type: "user_not_found",
				tier: "free",
			},
			extra: {
				email: userEmail,
				operation: "user_lookup",
			},
			user: { email: userEmail },
		});

		return NextResponse.json(
			{
				error: "user_not_found",
				message: "User account not found. Please sign up again.",
			},
			{ status: 404 },
		);
	}

	// Get user's matches with job details
	console.log("🎯 [FREE MATCHES] Fetching matches for user", { userId: user.id, userEmail });
	
	const { data: matches, error: matchesError } = await supabase
		.from("user_matches")
		.select(
			`job_id,
			match_score,
			match_reason,
			created_at,
			jobs:job_id (
				id,
				job_hash,
				title,
				company,
				company_name,
				location,
				city,
				country,
				description,
				job_url,
				work_environment,
				categories,
				is_internship,
				is_graduate,
				visa_friendly,
				posted_at,
				experience_required,
				salary_min,
				salary_max,
				visa_sponsored
			)`
		)
		.eq("user_id", user.id)
		.order("match_score", { ascending: false })
		.order("created_at", { ascending: false });

	console.log("📋 [FREE MATCHES] Query result", {
		matchesFound: matches?.length || 0,
		hasError: !!matchesError,
		error: matchesError?.message || null,
	});

	if (matchesError) {
		apiLogger.error(
			"Failed to fetch free user matches",
			matchesError as Error,
			{
				email: userEmail,
			},
		);

		// Capture in Sentry
		Sentry.captureException(new Error(`Failed to fetch free user matches: ${matchesError.message}`), {
			tags: {
				service: "matches-free",
				error_type: "database_query_failed",
				tier: "free",
			},
			extra: {
				email: userEmail,
				userId: user?.id,
				errorCode: matchesError.code,
				errorMessage: matchesError.message,
				operation: "fetch_user_matches",
			},
			user: { email: userEmail },
			level: "error",
		});

		return NextResponse.json(
			{
				error: "database_error",
				message: "Failed to load your matches. Please try again.",
			},
			{ status: 500 },
		);
	}

	// Transform the data - Supabase returns jobs as nested objects, we need to flatten them
	// CRITICAL FIX: Filter out matches with missing job data to prevent frontend errors
	const transformedMatches = (matches || [])
		.filter((match: any) => {
			// Ensure job data exists
			if (!match.jobs) {
				apiLogger.warn("Match missing job data", {
					email: userEmail,
					matchId: match.id,
				});
				return false;
			}
			return true;
		})
		.map((match: any) => {
			const jobData = match.jobs;
			return {
				id: jobData?.id,
				job_hash: jobData?.job_hash,
				title: jobData?.title || "Untitled Position",
				company: jobData?.company || "Unknown Company",
				company_name: jobData?.company_name || jobData?.company || "Unknown Company",
				location: jobData?.location || jobData?.city || "Location not specified",
				city: jobData?.city,
				country: jobData?.country,
				description: jobData?.description || "",
				url: jobData?.job_url,
				job_url: jobData?.job_url,
				work_environment: jobData?.work_environment,
				match_score: match.match_score || 0,
				match_reason: match.match_reason || "Matched",
				visa_confidence: jobData?.visa_friendly ? "likely" : "unknown",
				visa_confidence_label: jobData?.visa_friendly
					? "Visa Friendly"
					: "Unknown",
				categories: jobData?.categories || [],
				is_internship: jobData?.is_internship || false,
				is_graduate: jobData?.is_graduate || false,
				posted_at: jobData?.posted_at,
				experience_required: jobData?.experience_required,
				salary_min: jobData?.salary_min,
				salary_max: jobData?.salary_max,
				visa_sponsorship: jobData?.visa_sponsorship,
			};
		});

	// Get target companies for this user (companies that have been hiring recently)
	const { data: targetCompanies } = await supabase
		.from("user_matches")
		.select(`
			jobs:job_id (
				company,
				posted_at
			)
		`)
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	// Aggregate target companies
	const companyStats = new Map<
		string,
		{ count: number; lastMatchedAt: string; roles: string[] }
	>();
	(targetCompanies || []).forEach((match: any) => {
		const company = match.jobs?.company;
		const postedAt = match.jobs?.posted_at;
		if (company && postedAt) {
			const existing = companyStats.get(company) || {
				count: 0,
				lastMatchedAt: postedAt,
				roles: [],
			};
			existing.count++;
			existing.lastMatchedAt =
				postedAt > existing.lastMatchedAt ? postedAt : existing.lastMatchedAt;
			companyStats.set(company, existing);
		}
	});

	const targetCompaniesArray = Array.from(companyStats.entries())
		.map(([company, stats]) => ({
			company,
			lastMatchedAt: stats.lastMatchedAt,
			matchCount: stats.count,
			roles: stats.roles,
		}))
		.sort((a, b) => b.matchCount - a.matchCount)
		.slice(0, 5); // Top 5 companies

	apiLogger.info("Free matches loaded successfully", {
		email: userEmail,
		matchCount: transformedMatches.length,
		targetCompaniesCount: targetCompaniesArray.length,
	});

	return NextResponse.json({
		jobs: transformedMatches,
		targetCompanies: targetCompaniesArray,
		user: {
			email: user.email,
			tier: user.subscription_tier,
		},
	});
});
