import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../../../lib/api-logger";
import { asyncHandler, getRequestId } from "../../../../lib/errors";
import { SignupMatchingService } from "../../../../utils/services/SignupMatchingService";

// Simple replacements for deleted country functions


// Note: createConsolidatedMatcher import removed - using simplified matching engine
import { getDatabaseClient } from "../../../../utils/core/database-pool";
// import { getProductionRateLimiter } from "../../../../utils/production-rate-limiter"; // Temporarily disabled

// Input validation schema
// CRITICAL FIX: Make schema tolerant of empty strings and edge cases
const freeSignupSchema = z.object({
	email: z.string().email("Invalid email address").max(255, "Email too long"),
	full_name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name too long")
		.trim() // Remove leading/trailing whitespace
		.refine(
			(val) => val.length >= 2 && val.length <= 100,
			{ message: "Name must be between 2 and 100 characters" }
		)
		.refine(
			(val) => /^[\p{L}\s'.-]+$/u.test(val), // Unicode property \p{L} matches any letter from any language
			{ message: "Name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed." }
		),
	cities: z
		.array(z.string().max(50))
		.min(1, "Select at least one city")
		.max(3, "Maximum 3 cities allowed"),
	careerPath: z.array(z.string()).min(1, "Select at least one career path"),
	// Allow extra fields from frontend (but ignore them for free tier)
	entryLevelPreferences: z.array(z.string()).optional(),
	// CRITICAL FIX: Handle empty strings by converting to undefined
	visaStatus: z.string().optional().transform(val => val === "" ? undefined : val),
	terms_accepted: z.boolean().optional(),
	age_verified: z.boolean().optional(),
}).passthrough(); // Allow any additional fields

export const POST = asyncHandler(async (request: NextRequest) => {
	const requestId = getRequestId(request);

	// CRITICAL: Log immediately to catch silent failures
	console.log("[FREE SIGNUP] 🚀 Request received", {
		requestId,
		timestamp: new Date().toISOString(),
		url: request.url,
		method: request.method,
	});

	// CRITICAL: Capture request start to Sentry for debugging silent failures
	Sentry.captureMessage("Free signup request received", {
		level: "info",
		tags: {
			endpoint: "signup-free",
			stage: "request_received",
		},
		extra: {
			requestId,
			url: request.url,
			method: request.method,
			timestamp: new Date().toISOString(),
		},
	});

	// CRITICAL: Wrap entire function in try-catch to catch ANY silent exceptions
	try {

	// Set Sentry context for this request
	Sentry.setContext("request", {
		requestId,
		endpoint: "signup-free",
		method: "POST",
	});

	// Rate limiting - prevent abuse (more lenient for legitimate users)
	// TEMPORARILY DISABLED FOR DEBUGGING - Will re-enable after testing
	const rateLimitResult = false; // Temporarily disabled
	/*
	const rateLimitResult = await getProductionRateLimiter().middleware(
		request,
		"signup-free",
		{
			windowMs: 60 * 60 * 1000, // 1 hour
			maxRequests: 100, // TEMP: Increased from 10 to 100 for debugging
		},
	);
	*/

	if (rateLimitResult) {
		apiLogger.warn("Rate limit exceeded for free signup", {
			requestId,
			ip: request.headers.get("x-forwarded-for") || "unknown",
			endpoint: "signup-free",
		});
		Sentry.captureMessage("Rate limit exceeded for free signup", {
			level: "warning",
			tags: { endpoint: "signup-free", error_type: "rate_limit" },
			extra: {
				requestId,
				ip: request.headers.get("x-forwarded-for") || "unknown",
			},
		});
		return rateLimitResult;
	}

	// CRITICAL: Wrap JSON parsing in try-catch to catch parse errors
	let body;
	try {
		body = await request.json();
		console.log("[FREE SIGNUP] Request body received", {
			requestId,
			email: body.email,
			full_name: body.full_name,
			cities: body.cities,
			citiesLength: body.cities?.length,
			careerPath: body.careerPath,
			careerPathLength: body.careerPath?.length,
			visaStatus: body.visaStatus,
			hasBirthYear: !!body.birth_year,
			age_verified: body.age_verified,
			terms_accepted: body.terms_accepted,
		});
	} catch (parseError) {
		const error = parseError instanceof Error ? parseError : new Error(String(parseError));
		console.error("[FREE SIGNUP] ❌ JSON parse error", {
			requestId,
			error: error.message,
			stack: error.stack,
		});
		Sentry.captureException(error, {
			tags: {
				endpoint: "signup-free",
				error_type: "json_parse_error",
				critical: "true",
			},
			extra: {
				requestId,
				url: request.url,
			},
			level: "error",
		});
		throw error; // Re-throw to be caught by asyncHandler
	}

	// Validate input with zod
	const validationResult = freeSignupSchema.safeParse(body);
	console.log("[FREE SIGNUP] Validation result", {
		requestId,
		success: validationResult.success,
		errors: validationResult.success ? null : validationResult.error.issues,
	});

	if (!validationResult.success) {
		const errors = validationResult.error.issues
			.map((e: any) => `${e.path.join(".")}: ${e.message}`)
			.join(", ");
		const validationError = new Error(errors);

		// CRITICAL FIX: Log validation errors with full context for debugging
		apiLogger.warn("Free signup validation failed", validationError, {
			requestId,
			email: body.email,
			full_name: body.full_name,
			cities: body.cities,
			citiesLength: body.cities?.length,
			careerPath: body.careerPath,
			careerPathLength: body.careerPath?.length,
			visaStatus: body.visaStatus,
			entryLevelPreferences: body.entryLevelPreferences,
			terms_accepted: body.terms_accepted,
			age_verified: body.age_verified,
			validationErrors: validationResult.error.issues,
			requestBody: body,
		});

		// CRITICAL FIX: Only log to Sentry if it's a real validation issue, not expected edge cases
		// Filter out errors from optional fields that might be empty strings
		const criticalErrors = validationResult.error.issues.filter((issue: any) => {
			const path = issue.path.join(".");
			// Don't log errors for optional fields with empty values
			if (path === "visaStatus" && (body.visaStatus === "" || body.visaStatus === null || body.visaStatus === undefined)) {
				return false;
			}
			// Always log errors for required fields
			return ["email", "full_name", "cities", "careerPath"].includes(path);
		});

		// CRITICAL: Always capture validation errors to Sentry with full context
		// This helps us debug what's actually failing in production
		const errorPaths = validationResult.error.issues.map((issue: any) => issue.path.join("."));
		const hasRequiredFieldErrors = errorPaths.some(path => 
			["email", "full_name", "cities", "careerPath"].includes(path)
		);
		
		const validationException = new Error(
			`Free signup validation failed: ${validationResult.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
		);
		
		Sentry.captureException(validationException, {
			level: hasRequiredFieldErrors ? "error" : "warning",
			tags: { 
				endpoint: "signup-free", 
				error_type: "validation",
				validation_failed: "true",
				has_required_field_errors: hasRequiredFieldErrors ? "true" : "false",
				error_count: validationResult.error.issues.length.toString(),
			},
			extra: {
				requestId,
				email: body.email || "missing",
				full_name: body.full_name || "missing",
				cities: body.cities || [],
				citiesLength: body.cities?.length || 0,
				citiesType: Array.isArray(body.cities) ? "array" : typeof body.cities,
				careerPath: body.careerPath || [],
				careerPathLength: body.careerPath?.length || 0,
				careerPathType: Array.isArray(body.careerPath) ? "array" : typeof body.careerPath,
				visaStatus: body.visaStatus,
				entryLevelPreferences: body.entryLevelPreferences,
				terms_accepted: body.terms_accepted,
				age_verified: body.age_verified,
				// Detailed error breakdown
				allValidationErrors: validationResult.error.issues.map((e: any) => ({
					path: e.path.join("."),
					message: e.message,
					code: e.code,
					received: e.received,
					expected: e.expected,
				})),
				errorPaths: errorPaths,
				criticalErrors: criticalErrors.map((e: any) => ({
					path: e.path.join("."),
					message: e.message,
					code: e.code,
				})),
				// Full request body for debugging
				requestBody: JSON.stringify({
					email: body.email,
					full_name: body.full_name,
					cities: body.cities,
					careerPath: body.careerPath,
					visaStatus: body.visaStatus,
					entryLevelPreferences: body.entryLevelPreferences,
					terms_accepted: body.terms_accepted,
					age_verified: body.age_verified,
				}),
			},
			user: { email: body.email || "unknown" },
		});

		return NextResponse.json(
			{
				error: "invalid_input",
				message:
					"Please check your information and try again. All fields are required and must be valid.",
				details: validationResult.error.issues,
				requestId,
			},
			{ status: 400 },
		);
	}

	const { email, full_name, cities, careerPath } = validationResult.data;

	// NOTE: FREE tier does NOT use visaStatus, entryLevelPreferences, or age verification
	// These are PREMIUM-only features per signupformfreevpremium.md
	const visa_status = "EU citizen"; // Default for free tier users

	const supabase = getDatabaseClient();
	const normalizedEmail = email.toLowerCase().trim();
	console.log("[FREE SIGNUP] Checking for existing user", {
		requestId,
		normalizedEmail,
	});

	// Check if email already used (any tier)
	// NOTE: exec_sql RPC doesn't exist, using direct query instead
	let existingUser = null;
	try {
		const { data, error } = await supabase
			.from("users")
			.select("id, subscription_tier")
			.eq("email", normalizedEmail)
			.maybeSingle();

		console.log("[FREE SIGNUP] Existing user check result", {
			requestId,
			normalizedEmail,
			hasError: !!error,
			error: error ? { code: error.code, message: error.message } : null,
			existingUser: data ? { id: data.id, tier: data.subscription_tier } : null,
		});

		if (error) {
			apiLogger.warn("Error checking existing user", error as Error, {
				requestId,
				email: normalizedEmail,
				errorCode: error.code,
				errorMessage: error.message,
			});
			Sentry.captureException(error, {
				tags: { endpoint: "signup-free", error_type: "user_check" },
				extra: {
					requestId,
					email: normalizedEmail,
					errorCode: error.code,
				},
			});
		} else {
			existingUser = data;
		}
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : String(e);
		apiLogger.error("Unexpected error checking existing user", e as Error, {
			requestId,
			email: normalizedEmail,
			error: errorMessage,
		});
		Sentry.captureException(e instanceof Error ? e : new Error(errorMessage), {
			tags: { endpoint: "signup-free", error_type: "user_check_unexpected" },
			extra: {
				requestId,
				email: normalizedEmail,
			},
		});
		// Continue - don't block signup if check fails
	}

	if (existingUser) {
		console.log("[FREE SIGNUP] User already exists, returning 409", {
			requestId,
			normalizedEmail,
			userId: existingUser.id,
			tier: existingUser.subscription_tier,
		});

		// User already exists - redirect to matches regardless of tier
		// This prevents duplicate accounts and ensures users can access their matches
		const response = NextResponse.json(
			{
				error: "account_already_exists",
				message:
					"Looks like you already have a JobPing account! Taking you to your matches...",
				redirectToMatches: true,
			},
			{ status: 409 },
		);

		// Set cookie so they can access matches
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps =
			request.headers.get("x-forwarded-proto") === "https" ||
			request.url.startsWith("https://");

		response.cookies.set("user_email", normalizedEmail, {
			httpOnly: true,
			secure: isProduction && isHttps,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: "/",
		});

		// Check if they have matches
		const { data: existingMatches } = await supabase
			.from("user_matches")
			.select("job_id")
			.eq("user_id", existingUser.id)
			.limit(1);

		apiLogger.info("Existing free user tried to sign up again", {
			requestId,
			email: normalizedEmail,
			hasMatches: (existingMatches?.length || 0) > 0,
			matchCount: existingMatches?.length || 0,
		});

		return response;
	}

	// Note: Promo codes are stored in users table (promo_code_used, promo_expires_at)
	// No separate promo_pending table cleanup needed

	// Create free user record - ensure proper 30-day expiration
	const now = new Date();
	const freeExpiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now in milliseconds
	
	// Log for debugging timezone/timing issues
	console.log("[FREE SIGNUP] Expiration calculation", {
		requestId,
		now: now.toISOString(),
		freeExpiresAt: freeExpiresAt.toISOString(),
		timeDiff: freeExpiresAt.getTime() - now.getTime(),
		daysDiff: (freeExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
	});

	console.log("[FREE SIGNUP] Creating user", {
		requestId,
		normalizedEmail,
		full_name,
		cities,
		careerPath,
		visa_status,
	});

	// Insert user with full data in one operation
	// FREE users should NOT use auth.users - only exist in public.users
	// The foreign key constraint needs to be fixed to reference public.users.id
	const { data: minimalUserData, error: minimalError } = await supabase
		.from("users")
		.insert({
			email: normalizedEmail,
		})
		.select("id, email")
		.single();

	console.log("[FREE SIGNUP] Minimal user insert result", {
		requestId,
		normalizedEmail,
		hasError: !!minimalError,
		error: minimalError
			? { code: minimalError.code, message: minimalError.message }
			: null,
		userData: minimalUserData
			? { id: minimalUserData.id, email: minimalUserData.email }
			: null,
	});

	if (minimalError) {
		apiLogger.error("Failed to create minimal user", minimalError as Error, {
			requestId,
			email: normalizedEmail,
		});
		Sentry.captureException(minimalError, {
			tags: { endpoint: "signup-free", error_type: "user_creation" },
			extra: {
				requestId,
				email: normalizedEmail,
				stage: "minimal_user_insert",
			},
		});
		throw minimalError;
	}

	// Now try to update with additional fields (this might fail due to schema cache)
	let userData: any = minimalUserData;
	console.log("[FREE SIGNUP] Updating user with additional fields", {
		requestId,
		normalizedEmail,
		userId: minimalUserData.id,
	});

	try {
		// Form now sends long form directly (data-analytics, finance-investment, etc)
		// No conversion needed - store as-is
		const { data: updatedUserData, error: updateError } = await supabase
			.from("users")
			.update({
				full_name,
				subscription_tier: "free",
				free_signup_at: new Date().toISOString(),
				free_expires_at: freeExpiresAt.toISOString(),
				target_cities: cities,
				career_path: careerPath[0] || null,
				// NOTE: FREE tier does NOT set entry_level_preference
				// This is a PREMIUM-only matching feature
				visa_status: visa_status,
				email_verified: true,
				subscription_active: false,
			})
			.eq("id", minimalUserData.id)
			.select()
			.single();

		console.log("[FREE SIGNUP] User update result", {
			requestId,
			normalizedEmail,
			hasError: !!updateError,
			error: updateError
				? { code: updateError.code, message: updateError.message }
				: null,
			updated: !!updatedUserData,
		});

		if (!updateError && updatedUserData) {
			userData = updatedUserData;
		}
		// If update fails, continue with minimal user data
	} catch (updateError) {
		const errorMessage =
			updateError instanceof Error ? updateError.message : String(updateError);
		apiLogger.warn(
			"Failed to update user with additional fields, continuing with minimal data",
			{
				requestId,
				email: normalizedEmail,
				error: errorMessage,
			},
		);
		Sentry.captureException(
			updateError instanceof Error ? updateError : new Error(errorMessage),
			{
				tags: { endpoint: "signup-free", error_type: "user_update" },
				level: "warning",
				extra: {
					requestId,
					email: normalizedEmail,
					stage: "user_field_update",
				},
			},
		);
	}

	// CRITICAL FIX: Ensure target_cities is always an array
	// Supabase might return it in different formats, so normalize it
	let targetCities: string[] = [];
	if (userData.target_cities) {
		if (Array.isArray(userData.target_cities)) {
			targetCities = userData.target_cities;
		} else if (typeof userData.target_cities === "string") {
			// Handle case where it might be a JSON string
			try {
				targetCities = JSON.parse(userData.target_cities);
			} catch {
				// If not JSON, treat as single city
				targetCities = [userData.target_cities];
			}
		}
	}

	// Fallback to cities if target_cities is empty (shouldn't happen, but safety check)
	if (targetCities.length === 0 && cities && cities.length > 0) {
		targetCities = cities;
	}

	apiLogger.info("Free signup - cities normalized", {
		requestId,
		email: normalizedEmail,
		original: userData.target_cities,
		normalized: targetCities,
		type: typeof userData.target_cities,
		isArray: Array.isArray(userData.target_cities),
	});

	// REFACTORED: Only use fields that FREE tier form actually collects
	// Form fields: email, fullName, cities, careerPath (that's it!)
	// NO visa, NO entry_level, NO skills, NO industries (premium-only)
	// CRITICAL: Validate userData.id exists before proceeding
	if (!userData || !userData.id) {
		const error = new Error(`User creation failed - no user ID available. userData: ${JSON.stringify(userData)}`);
		apiLogger.error("Free signup - user creation validation failed", error, {
			requestId,
			email: normalizedEmail,
			userData: userData,
		});
		Sentry.captureException(error, {
			tags: { endpoint: "signup-free", error_type: "user_creation_validation" },
			extra: {
				requestId,
				email: normalizedEmail,
				userData: userData,
			},
		});
		throw error;
	}

	// CRITICAL FIX: Ensure career_path is properly set from validation data
	// careerPath comes from form as array, stored as string in DB, need to ensure it's available
	const careerPathForMatching = userData.career_path 
		? [userData.career_path] 
		: (careerPath && careerPath.length > 0 ? careerPath : []);
	
	if (careerPathForMatching.length === 0) {
		const error = new Error("Career path is required for matching");
		apiLogger.error("Free signup - career_path missing", error, {
			requestId,
			email: normalizedEmail,
			userData_career_path: userData.career_path,
			careerPath_from_validation: careerPath,
		});
		throw error;
	}

	const userPrefs = {
		email: userData.email,
		user_id: userData.id, // Add user_id for proper foreign key relationships
		target_cities: targetCities,
		career_path: careerPathForMatching,
		subscription_tier: "free" as const,
	};

	apiLogger.info("Free signup - userPrefs created", {
		requestId,
		email: normalizedEmail,
		user_id: userData.id,
		user_id_type: typeof userData.id,
		target_cities: targetCities,
		career_path: userPrefs.career_path,
		career_path_length: userPrefs.career_path.length,
	});

	apiLogger.info("Free signup - delegating to SignupMatchingService", {
		requestId,
		email: normalizedEmail,
		targetCities: targetCities,
		careerPath: userData.career_path,
		note: "SignupMatchingService handles all job fetching and filtering",
	});

	// REFACTORED: Use consolidated matching service
	console.log("[FREE SIGNUP] ✅ Validation passed, testing SignupMatchingService import", {
		hasSignupMatchingService: !!SignupMatchingService,
		hasGetConfig: typeof SignupMatchingService.getConfig,
		hasRunMatching: typeof SignupMatchingService.runMatching,
	});
	
	console.log("[FREE SIGNUP] ✅ Starting matching", {
		requestId,
		normalizedEmail,
		userData: {
			id: userData.id,
			email: userData.email,
			subscription_tier: userData.subscription_tier,
		},
		userPrefs: {
			email: userPrefs.email,
			target_cities: userPrefs.target_cities,
			career_path: userPrefs.career_path,
			user_id: userPrefs.user_id,
		},
	});

	// Test SignupMatchingService import and methods
	let matchingConfig;
	try {
		console.log("[FREE SIGNUP] Testing SignupMatchingService.getConfig");
		matchingConfig = SignupMatchingService.getConfig("free");
		console.log("[FREE SIGNUP] ✅ getConfig successful:", matchingConfig);
	} catch (configError) {
		const error = configError instanceof Error ? configError : new Error(String(configError));
		
		console.error("[FREE SIGNUP] ❌ getConfig failed:", configError);
		
		// CRITICAL: Capture to Sentry before throwing
		Sentry.captureException(error, {
			tags: {
				endpoint: "signup-free",
				service: "SignupMatchingService",
				method: "getConfig",
				error_type: "config_error",
			},
			extra: {
				requestId,
				email: normalizedEmail,
			},
			user: { email: normalizedEmail },
			level: "error",
		});
		
		throw new Error(`SignupMatchingService.getConfig failed: ${error.message}`);
	}
	
	console.log("[FREE SIGNUP] About to call SignupMatchingService.runMatching", {
		requestId,
		userPrefs,
		matchingConfig,
	});
	
	let matchingResult;
	try {
		matchingResult = await SignupMatchingService.runMatching(
			userPrefs,
			matchingConfig,
			requestId,
			// No pre-filtered jobs - let SignupMatchingService handle everything
		);
		
		console.log("[FREE SIGNUP] ✅ SignupMatchingService.runMatching completed successfully", {
			requestId,
			matchingResult,
			hasError: !!matchingResult.error,
			matchCount: matchingResult.matchCount,
		});
	} catch (matchingError) {
		const error = matchingError instanceof Error ? matchingError : new Error(String(matchingError));
		
		console.error("[FREE SIGNUP] ❌ SignupMatchingService.runMatching failed", {
			requestId,
			error: matchingError,
			errorMessage: error.message,
			errorStack: error.stack,
		});

		// CRITICAL: Capture to Sentry with full context
		Sentry.captureException(error, {
			tags: {
				endpoint: "signup-free",
				service: "SignupMatchingService",
				method: "runMatching",
				error_type: "matching_service_error",
			},
			extra: {
				requestId,
				email: normalizedEmail,
				operation: "matching",
			},
			user: { email: normalizedEmail },
			level: "error",
		});
		
		// Create a failed result to continue processing
		matchingResult = {
			success: false,
			matchCount: 0,
			matches: [],
			processingTime: 0,
			method: "error",
			error: error.message,
		};
	}

	const matchesCount = matchingResult.matchCount;
	console.log("[FREE SIGNUP] Matching complete", {
		requestId,
		normalizedEmail,
		matchesCount,
		method: matchingResult.method,
		hasError: !!matchingResult.error,
		error: matchingResult.error || null,
	});

	// Check for matches
	// CRITICAL FIX: Return 200 even when matchesCount is 0 - let frontend handle gracefully
	// This prevents the API client from treating it as an error (404)
	if (matchesCount === 0) {
		const matchingReason =
			matchingResult.error || "No jobs matched user criteria after filtering";
		
		// Handle database errors differently from no-match scenarios
		if (matchingResult.error === "DATABASE_ERROR") {
			apiLogger.error("Free signup - database error during job fetching", new Error("Database error during job fetching"), {
				requestId,
				email: normalizedEmail,
				method: matchingResult.method,
				userCriteria: {
					cities: targetCities,
					careerPath: userData.career_path,
					visaStatus: userData.visa_status,
				},
			});
			
			Sentry.captureMessage("Free signup - database error during job fetching", {
				level: "error",
				tags: { endpoint: "signup-free", error_type: "database_error" },
				extra: {
					requestId,
					email: normalizedEmail,
					method: matchingResult.method,
					cities: targetCities,
					careerPath: userData.career_path,
				},
				user: { email: normalizedEmail },
			});
			
			return NextResponse.json(
				{
					error: "database_error",
					message: "We're experiencing technical difficulties. Please try again in a few minutes.",
					requestId,
				},
				{ status: 500 },
			);
		}

		// Regular no-matches scenario - return 200 with matchesCount: 0
		// This allows the frontend to handle it gracefully instead of showing an error
		apiLogger.info("Free signup - no matches found for user criteria", {
			requestId,
			email: normalizedEmail,
			method: matchingResult.method,
			reason: matchingReason,
			userCriteria: {
				cities: targetCities,
				careerPath: userData.career_path,
				visaStatus: userData.visa_status,
			},
		});
		
		// Don't spam Sentry for expected no-matches scenarios
		// Only log if it's unexpected (e.g., many jobs available but none matched)
		
		// Return 200 with matchesCount: 0 so frontend can handle gracefully
		const response = NextResponse.json({
			success: true,
			matchesCount: 0,
			userId: userData.id,
			email: userData.email,
			warning: "no_matches_found",
			message: `No matches found. ${matchingReason}. Try different cities or career paths.`,
			details: {
				cities: targetCities,
				careerPath: userData.career_path,
				method: matchingResult.method,
				reason: matchingReason,
			},
			requestId,
		});

		// Set session cookie even when no matches (user still signed up successfully)
		const isProduction = process.env.NODE_ENV === "production";
		const secure = isProduction;
		response.cookies.set("user_email", userData.email, {
			httpOnly: true,
			secure: secure,
			sameSite: "lax",
			maxAge: 30 * 24 * 60 * 60, // 30 days
			path: "/",
		});

		return response;
	}

	// REFACTORED: Service already saved matches, create response
	const response = NextResponse.json({
		success: true,
		matchesCount: matchesCount,
		userId: userData.id,
		email: userData.email,
	});

	// Set session cookie for client-side auth
	// Set a session cookie (simple approach - you may want JWT instead)
	// Cookie expiration matches user expiration (30 days)
	// FIXED: In production, always set secure flag. Vercel automatically handles HTTPS
	// In development (localhost), secure is false which is correct
	const isProduction = process.env.NODE_ENV === "production";
	const secure = isProduction; // Simplified: production always uses HTTPS on Vercel

	try {
		response.cookies.set("user_email", userData.email, {
			httpOnly: true,
			secure: secure,
			sameSite: "lax",
			maxAge: 30 * 24 * 60 * 60, // 30 days
			path: "/",
		});
	} catch (sessionError) {
		const error = sessionError instanceof Error ? sessionError : new Error(String(sessionError));
		
		apiLogger.warn(
			"Failed to create user_email cookie (non-critical)",
			error,
			{
				requestId,
				email: normalizedEmail,
			},
		);

		// Capture to Sentry (warning level - non-critical but should be tracked)
		Sentry.captureException(error, {
			tags: {
				endpoint: "signup-free",
				error_type: "session_cookie_error",
				critical: "false",
			},
			extra: {
				requestId,
				email: normalizedEmail,
			},
			user: { email: normalizedEmail },
			level: "warning",
		});
	}

	apiLogger.info("Cookie set for user", {
		requestId,
		email: normalizedEmail,
		secure: secure,
		isProduction,
	});

	apiLogger.info("Free signup successful", {
		requestId,
		email: normalizedEmail,
		matchCount: matchesCount,
	});

	console.log("[FREE SIGNUP] 🎉 Signup successful, returning response", {
		requestId,
		normalizedEmail,
		userId: userData.id,
		matchCount: matchesCount,
		hasSessionCookie: true,
	});

	return response;

	} catch (criticalError) {
		console.error("[FREE SIGNUP] 🚨 CRITICAL ERROR - Silent exception caught:", {
			requestId,
			error: criticalError,
			errorMessage: criticalError instanceof Error ? criticalError.message : String(criticalError),
			errorStack: criticalError instanceof Error ? criticalError.stack : undefined,
			timestamp: new Date().toISOString(),
		});

		// Force Sentry capture of the silent exception
		Sentry.captureException(criticalError instanceof Error ? criticalError : new Error(String(criticalError)), {
			tags: {
				endpoint: "signup-free",
				error_type: "silent_exception",
				critical: "true",
			},
			extra: {
				requestId,
				operation: "complete_signup_flow",
				timestamp: new Date().toISOString(),
			},
			level: "error",
		});

		// Return a proper error response
		return NextResponse.json(
			{
				error: "internal_error",
				message: "An unexpected error occurred during signup. Please try again.",
				requestId,
			},
			{ status: 500 },
		);
	}
});
