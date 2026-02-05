import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../../../lib/api-logger";
import { asyncHandler, getRequestId } from "../../../../lib/errors";
import { SignupMatchingService } from "../../../../utils/services/SignupMatchingService";
import {
	logSignupEvent,
} from "../../../../lib/debug-signup";
import { LOG_MARKERS } from "../../../../lib/log-markers";

// Simple replacements for deleted country functions


// Note: createConsolidatedMatcher import removed - using simplified matching engine
import { getDatabaseClient } from "../../../../utils/core/database-pool";
// import { getProductionRateLimiter } from "../../../../utils/production-rate-limiter"; // Temporarily disabled

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// CRITICAL: Explicitly set runtime to ensure route is compiled correctly
// This helps Next.js recognize the route handler
export const runtime = "nodejs";

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
		// FIX: More lenient validation - allow more characters while still preventing injection
		.refine(
			(val) => {
				// Allow letters, spaces, hyphens, apostrophes, periods, and common accented characters
				// More lenient than before but still safe
				return /^[\p{L}\p{M}\s'.-]+$/u.test(val) && 
				       !/[<>{}[\]\\\/]/.test(val) && // Block potentially dangerous chars
				       val.trim().length >= 2; // Ensure meaningful content after trim
			},
			{ message: "Please enter a valid name (2-100 characters, letters and common punctuation only)" }
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
	logSignupEvent("REQUEST_RECEIVED", {
		url: request.url,
		method: request.method,
		sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
	}, requestId);

	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.API_REQUEST} 🚀 Request received`, {
		requestId,
		timestamp: new Date().toISOString(),
		url: request.url,
		method: request.method,
	});

	// CRITICAL: Capture request start to Sentry for debugging silent failures
	try {
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
				sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
			},
		});
	} catch (sentryError) {
		logSignupEvent("SENTRY_CAPTURE_FAILED", {
			message: "Failed to capture message to Sentry",
			error: sentryError instanceof Error ? sentryError.message : String(sentryError),
		}, requestId, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
	}
	// Note: Don't flush info messages immediately - only flush errors

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
		// FIX: Rate limiting is expected behavior - log as INFO, not WARNING
		apiLogger.info("Rate limit exceeded for free signup", {
			requestId,
			ip: request.headers.get("x-forwarded-for") || "unknown",
			endpoint: "signup-free",
		});
		// FIX: Don't log rate limits to Sentry - this is expected behavior
		// Only log if it's an unexpected rate limit scenario
		return rateLimitResult;
	}

	// CRITICAL: Wrap JSON parsing in try-catch to catch parse errors
	let body;
	try {
		body = await request.json();
		console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.API_REQUEST} Request body received`, {
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
		console.error(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.API_ERROR} ❌ JSON parse error`, {
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
				errorMessage: error.message,
				errorStack: error.stack,
			},
			level: "error",
		});
		// CRITICAL: Flush Sentry before throwing
		await Sentry.flush(2000);
		throw error; // Re-throw to be caught by asyncHandler
	}

	// Validate input with zod
	const validationResult = freeSignupSchema.safeParse(body);
	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.VALIDATION} Validation result`, {
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
		
		// FIX: Only log validation errors to Sentry if they're for required fields
		// Optional field validation failures are expected and shouldn't spam Sentry
		if (hasRequiredFieldErrors) {
			const validationException = new Error(
				`Free signup validation failed: ${validationResult.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
			);
			
			Sentry.captureException(validationException, {
				level: "warning", // Changed from error to warning - validation errors are user input issues
				tags: { 
					endpoint: "signup-free", 
					error_type: "validation",
					validation_failed: "true",
					has_required_field_errors: "true",
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

			// Flush Sentry before returning validation error
			await Sentry.flush(2000);
		} else {
			// Optional field validation errors - just log to console, don't spam Sentry
			console.log("[FREE SIGNUP] Validation warnings (optional fields)", {
				requestId,
				email: body.email || "missing",
				warnings: validationResult.error.issues.map((e: any) => ({
					path: e.path.join("."),
					message: e.message,
				})),
			});
		}

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
		console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.DB_QUERY} Checking for existing user`, {
			requestId,
			normalizedEmail,
		});

	// For free signup, we don't pre-check for existing accounts
	// Just try to create the user - database UNIQUE constraint will prevent duplicates
	// This avoids false positives from case-sensitivity or query issues

	// Note: Promo codes are stored in users table (promo_code_used, promo_expires_at)
	// No separate promo_pending table cleanup needed

	// Track if this is a duplicate user so we skip the update
	let isDuplicateUser = false;

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

	// For free signup: email is optional. Try to use provided email if unique,
	// otherwise generate a placeholder. The real goal is generating matches ASAP.
	let userEmail = normalizedEmail;
	
	// Normalize email to lowercase for consistency
	const emailToStore = userEmail ? userEmail.toLowerCase() : null;

	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.DB_INSERT} Creating user`, {
		requestId,
		userEmail: emailToStore,
		full_name,
		cities,
		careerPath,
		visa_status,
	});

	// Insert user - email is now optional
	const { data: minimalUserData, error: minimalError } = await supabase
		.from("users")
		.insert({
			email: emailToStore,
		})
		.select("id, email")
		.single();

	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.DB_SUCCESS} Minimal user insert result`, {
		requestId,
		userEmail: emailToStore,
		hasError: !!minimalError,
		error: minimalError
			? { code: minimalError.code, message: minimalError.message }
			: null,
		userData: minimalUserData
			? { id: minimalUserData.id, email: minimalUserData.email }
			: null,
	});

	// Initialize userData - will be updated based on error or success
	let userData: any = minimalUserData;

	if (minimalError) {
		// Check if it's a duplicate email error
		const isDuplicateEmail = minimalError.code === '23505' || minimalError.message?.includes('users_email_key');
		
		if (isDuplicateEmail && emailToStore) {
			// Email duplicate - that's fine for free signup
			// Just fetch the existing user and continue
			console.log(`${LOG_MARKERS.SIGNUP_FREE} Email already exists (duplicate signup attempt)`, {
				requestId,
				userEmail: emailToStore,
			});
			
			apiLogger.info("Duplicate email in free signup - reusing existing user", {
				requestId,
				email: emailToStore,
			});
			
			// Fetch the existing user so we can use their ID for matches
			const { data: existingUser, error: fetchError } = await supabase
				.from("users")
				.select("id, email")
				.eq("email", emailToStore)
				.maybeSingle();
			
			if (existingUser) {
				console.log(`${LOG_MARKERS.SIGNUP_FREE} Using existing user for duplicate email`, {
					requestId,
					userId: existingUser.id,
				});
				
				// Use existing user's ID for matches
				userData = { id: existingUser.id, email: existingUser.email };
				isDuplicateUser = true; // Set flag to skip update
			} else {
				// Couldn't find duplicate - this is an error we can't recover from
				apiLogger.error("Email duplicate error but couldn't find the user", fetchError as Error, {
					requestId,
					email: emailToStore,
				});
				Sentry.captureException(minimalError, {
					tags: { endpoint: "signup-free", error_type: "duplicate_email_not_found" },
					extra: {
						requestId,
						email: emailToStore,
					},
				});
				throw minimalError;
			}
		} else if (isDuplicateEmail) {
			// Duplicate but no email provided? That's a real error
			apiLogger.error("User creation failed - duplicate key but no email", minimalError as Error, {
				requestId,
			});
			Sentry.captureException(minimalError, {
				tags: { endpoint: "signup-free", error_type: "user_creation_failed" },
				extra: { requestId },
			});
			throw minimalError;
		} else {
			// Some other error - let it propagate
			apiLogger.error("Failed to create user", minimalError as Error, {
				requestId,
				email: emailToStore,
			});
			Sentry.captureException(minimalError, {
				tags: { endpoint: "signup-free", error_type: "user_creation" },
				extra: {
					requestId,
					email: emailToStore,
					stage: "minimal_user_insert",
				},
			});
			throw minimalError;
		}
	}

	// Now try to update with additional fields
	// This is best-effort - if it fails, we still proceed to match generation
	if (!isDuplicateUser && minimalUserData) {
		console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.DB_UPDATE} Updating user with additional fields`, {
			requestId,
			userEmail: emailToStore,
			userId: minimalUserData.id,
		});

		try {
			// Form now sends long form directly (data-analytics, finance-investment, etc)
			// No conversion needed - store as-is
			const { data: updatedUserData, error: updateError } = await supabase
				.from("users")
				.update({
					full_name: full_name || userData?.full_name,
					subscription_tier: "free",
					free_signup_at: new Date().toISOString(),
					free_expires_at: freeExpiresAt.toISOString(),
					target_cities: cities || userData?.target_cities,
					career_path: careerPath[0] || userData?.career_path,
					// NOTE: FREE tier does NOT set entry_level_preference
					// This is a PREMIUM-only matching feature
					visa_status: visa_status || userData?.visa_status,
					email_verified: emailToStore ? true : false,
					subscription_active: false,
				})
				.eq("id", minimalUserData.id)
				.select()
				.single();

			console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.DB_SUCCESS} User update result`, {
				requestId,
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
			console.warn(
				`${LOG_MARKERS.SIGNUP_FREE} Failed to update user with additional fields, continuing with minimal data`,
				{
					requestId,
					error: errorMessage,
				},
			);
			apiLogger.warn(
				"Failed to update user with additional fields, continuing with minimal data",
				{
					requestId,
					error: errorMessage,
				},
			);
			// Don't throw - just continue with minimal data
			userData = minimalUserData;
		}
	} else if (minimalUserData && !userData) {
		userData = minimalUserData;
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
	
	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.MATCHING_START} ✅ Starting matching`, {
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
		
		// CRITICAL: Capture to Sentry before throwing and FLUSH
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
				errorMessage: error.message,
				errorStack: error.stack,
			},
			user: { email: normalizedEmail },
			level: "error",
		});

		// CRITICAL: Flush Sentry to ensure error is sent before throwing
		await Sentry.flush(2000);
		
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
		
		console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.MATCHING_COMPLETE} ✅ SignupMatchingService.runMatching completed successfully`, {
			requestId,
			matchingResult,
			hasError: !!matchingResult.error,
			matchCount: matchingResult.matchCount,
		});
	} catch (matchingError) {
		const error = matchingError instanceof Error ? matchingError : new Error(String(matchingError));
		
		console.error(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.MATCHING_ERROR} ❌ SignupMatchingService.runMatching failed`, {
			requestId,
			error: matchingError,
			errorMessage: error.message,
			errorStack: error.stack,
		});

		// CRITICAL: Capture to Sentry with full context and FLUSH
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
				errorMessage: error.message,
				errorStack: error.stack,
			},
			user: { email: normalizedEmail },
			level: "error",
		});

		// CRITICAL: Flush Sentry to ensure error is sent
		await Sentry.flush(2000);
		
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
	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.MATCHING_COMPLETE} Matching complete`, {
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

	console.log(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.SIGNUP_SUCCESS} 🎉 Signup successful, returning response`, {
		requestId,
		normalizedEmail,
		userId: userData.id,
		matchCount: matchesCount,
		hasSessionCookie: true,
	});

	return response;

	} catch (criticalError) {
		const error = criticalError instanceof Error ? criticalError : new Error(String(criticalError));
		
		// CRITICAL: Log to debug system FIRST (works even if Sentry fails)
		logSignupEvent("CRITICAL_ERROR", {
			operation: "complete_signup_flow",
			errorMessage: error.message,
			errorStack: error.stack,
		}, requestId, error);
		
		console.error(`${LOG_MARKERS.SIGNUP_FREE} ${LOG_MARKERS.CRITICAL_ERROR} 🚨 CRITICAL ERROR - Silent exception caught:`, {
			requestId,
			error: criticalError,
			errorMessage: error.message,
			errorStack: error.stack,
			timestamp: new Date().toISOString(),
		});

		// CRITICAL: Force Sentry capture and FLUSH to ensure it's sent
		try {
			Sentry.captureException(error, {
				tags: {
					endpoint: "signup-free",
					error_type: "silent_exception",
					critical: "true",
				},
				extra: {
					requestId,
					operation: "complete_signup_flow",
					timestamp: new Date().toISOString(),
					errorMessage: error.message,
					errorStack: error.stack,
				},
				level: "error",
			});

			// CRITICAL: Flush Sentry to ensure error is sent before response
			await Sentry.flush(2000); // Wait up to 2 seconds for Sentry to send
		} catch (sentryError) {
			logSignupEvent("SENTRY_FLUSH_FAILED", {
				message: "Failed to flush Sentry",
				originalError: error.message,
				sentryError: sentryError instanceof Error ? sentryError.message : String(sentryError),
			}, requestId, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
		}

		// CRITICAL: Re-throw error so asyncHandler can also capture it
		// This ensures error is captured even if inner catch block fails
		throw error;
	}
});
