import { type NextRequest, NextResponse } from "next/server";
import { isTest } from "../../../lib/env";
import { asyncHandler, ValidationError } from "../../../lib/errors";
import {
	markUserVerified,
	verifyVerificationToken,
} from "../../../utils/email-verification";
import { getProductionRateLimiter } from "../../../utils/production-rate-limiter";
import { getBaseUrl } from "../../../utils/url-helpers";
import { getDatabaseClient } from "../../../utils/core/database-pool";
import { SignupMatchingService } from "../../../utils/services/SignupMatchingService";
import { apiLogger } from "../../../lib/api-logger";
import * as Sentry from "@sentry/nextjs";

// Test mode helper - using professional pattern
const isTestMode = () => isTest();

// Helper function to build premium user preferences from database user record
function buildPremiumUserPrefs(user: any) {
	return {
		email: user.email,
		user_id: user.id,
		target_cities: user.target_cities || [],
		career_path: user.career_path ? user.career_path.split(" / ") : [],
		languages_spoken: user.languages_spoken || [],
		entry_level_preference: user.entry_level_preference,
		work_environment: user.work_environment,
		visa_status: user.visa_status,
		subscription_tier: user.subscription_tier,
	};
}

export const POST = asyncHandler(async (request: NextRequest) => {
	// PRODUCTION: Rate limiting for email verification (prevent abuse)
	// Skip rate limiting in test mode
	if (!isTestMode()) {
		const rateLimitResult = await getProductionRateLimiter().middleware(
			request,
			"verify-email",
		);
		if (rateLimitResult) {
			return rateLimitResult;
		}
	}

	const { token, email } = await request.json();

	if (!token || !email) {
		throw new ValidationError("Email and verification token required");
	}

	const verification = await verifyVerificationToken(email, token);
	if (!verification.valid) {
		return NextResponse.json(
			{
				success: false,
				error: "Invalid or expired token",
				reason: verification.reason,
			},
			{ status: 400 },
		);
	}

	await markUserVerified(email);

	// CRITICAL FIX: Trigger matching for premium users after verification
	try {
		const supabase = getDatabaseClient();
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("email", email)
			.single();

		if (userError) {
			apiLogger.error("Failed to fetch user after verification", userError as Error, { email });
		} else if (user && (user.subscription_tier === "premium_pending" || user.subscription_tier === "premium")) {
			// Check if user already has matches to prevent duplicate processing
			const { data: existingMatches } = await supabase
				.from("user_matches")
				.select("id")
				.eq("user_id", user.id)
				.limit(1);

			if (!existingMatches || existingMatches.length === 0) {
				apiLogger.info("Triggering premium matching after email verification", {
					email: user.email,
					tier: user.subscription_tier,
				});

				const userPrefs = buildPremiumUserPrefs(user);
				const config = SignupMatchingService.getConfig("premium_pending");
				const matchingResult = await SignupMatchingService.runMatching(userPrefs, config);

				apiLogger.info("Premium matching completed after verification", {
					email: user.email,
					matchCount: matchingResult.matchCount,
					method: matchingResult.method,
				});

				// Set cookie for immediate access to matches
				const response = NextResponse.json({ success: true, matchesGenerated: true, matchCount: matchingResult.matchCount }, { status: 200 });
				
				// Set session cookie (same pattern as signup routes)
				const isProduction = process.env.NODE_ENV === "production";
				const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https://");
				
				response.cookies.set("user_email", user.email, {
					httpOnly: true,
					secure: isProduction && isHttps,
					sameSite: "lax",
					maxAge: 60 * 60 * 24 * 30, // 30 days
					path: "/",
				});

				return response;
			} else {
				apiLogger.info("Premium user already has matches, skipping generation", {
					email: user.email,
					existingMatchCount: existingMatches.length,
				});
			}
		}
	} catch (matchingError) {
		// Log error but don't fail verification - matching can be retried later
		apiLogger.error("Failed to trigger premium matching after verification", matchingError as Error, { email });
		Sentry.captureException(matchingError instanceof Error ? matchingError : new Error(String(matchingError)), {
			tags: {
				service: "email-verification",
				error_type: "premium_matching_failed",
				operation: "post_verification_matching",
			},
			extra: {
				email,
				errorMessage: matchingError instanceof Error ? matchingError.message : String(matchingError),
			},
			user: { email },
			level: "error",
		});
	}

	return NextResponse.json({ success: true }, { status: 200 });
});

export const GET = asyncHandler(async (req: NextRequest) => {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");
	const email = searchParams.get("email");

	if (!token || !email) {
		throw new ValidationError("Missing email or token");
	}

	const verification = await verifyVerificationToken(email, token);
	const baseUrl = getBaseUrl();

	if (!verification.valid) {
		// Redirect to signup success page with error message
		return NextResponse.redirect(
			`${baseUrl}/signup/success?verified=false&error=${encodeURIComponent(verification.reason || "Invalid or expired token")}&email=${encodeURIComponent(email)}`,
		);
	}

	// Check user tier and subscription status to determine redirect destination
	const supabase = getDatabaseClient();
	const { data: user } = await supabase
		.from("users")
		.select("*")
		.eq("email", email)
		.single();

	// CRITICAL FIX: Trigger matching for premium users after verification (GET endpoint)
	if (user && (user.subscription_tier === "premium_pending" || user.subscription_tier === "premium")) {
		try {
			// Check if user already has matches to prevent duplicate processing
			const { data: existingMatches } = await supabase
				.from("user_matches")
				.select("id")
				.eq("user_id", user.id)
				.limit(1);

			if (!existingMatches || existingMatches.length === 0) {
				apiLogger.info("Triggering premium matching after email verification (GET)", {
					email: user.email,
					tier: user.subscription_tier,
				});

				const userPrefs = buildPremiumUserPrefs(user);
				const config = SignupMatchingService.getConfig("premium_pending");
				const matchingResult = await SignupMatchingService.runMatching(userPrefs, config);

				apiLogger.info("Premium matching completed after verification (GET)", {
					email: user.email,
					matchCount: matchingResult.matchCount,
					method: matchingResult.method,
				});
			} else {
				apiLogger.info("Premium user already has matches, skipping generation (GET)", {
					email: user.email,
					existingMatchCount: existingMatches.length,
				});
			}
		} catch (matchingError) {
			// Log error but don't fail verification - matching can be retried later
			apiLogger.error("Failed to trigger premium matching after verification (GET)", matchingError as Error, { email });
			Sentry.captureException(matchingError instanceof Error ? matchingError : new Error(String(matchingError)), {
				tags: {
					service: "email-verification",
					error_type: "premium_matching_failed",
					operation: "get_verification_matching",
				},
				extra: {
					email,
					errorMessage: matchingError instanceof Error ? matchingError.message : String(matchingError),
				},
				user: { email },
				level: "error",
			});
		}
	}

	// 🟢 FIXED BUG #14: Only redirect to billing if premium AND subscription not already active
	// This prevents showing billing page to users with active subscriptions or promo codes
	const shouldShowBilling =
		user?.subscription_tier === "premium" && !user?.subscription_active;

	const redirectUrl = shouldShowBilling
		? `${baseUrl}/billing?verified=true&email=${encodeURIComponent(email)}`
		: `${baseUrl}/signup/success?verified=true&email=${encodeURIComponent(email)}`;

	return NextResponse.redirect(redirectUrl);
});
