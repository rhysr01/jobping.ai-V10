/**
 * Standardized Log Markers for Vercel Logs
 * 
 * Use these markers to easily filter/search logs in Vercel Dashboard
 * Format: [MARKER] message
 * 
 * Search patterns for Vercel:
 * - [SIGNUP_FREE] - Free signup operations
 * - [SIGNUP_PREMIUM] - Premium signup operations
 * - [MATCHING] - Matching operations
 * - [MATCHING_FREE] - Free tier matching
 * - [MATCHING_PREMIUM] - Premium tier matching
 * - [DB] - Database operations
 * - [DB_QUERY] - Database queries
 * - [DB_ERROR] - Database errors
 * - [API] - API route handlers
 * - [API_ERROR] - API errors
 * - [AUTH] - Authentication operations
 * - [EMAIL] - Email operations
 * - [VALIDATION] - Validation operations
 */

export const LOG_MARKERS = {
	// Signup Operations
	SIGNUP_FREE: "[SIGNUP_FREE]",
	SIGNUP_PREMIUM: "[SIGNUP_PREMIUM]",
	SIGNUP_START: "[SIGNUP_START]",
	SIGNUP_SUCCESS: "[SIGNUP_SUCCESS]",
	SIGNUP_ERROR: "[SIGNUP_ERROR]",
	SIGNUP_VALIDATION: "[SIGNUP_VALIDATION]",

	// Matching Operations
	MATCHING: "[MATCHING]",
	MATCHING_FREE: "[MATCHING_FREE]",
	MATCHING_PREMIUM: "[MATCHING_PREMIUM]",
	MATCHING_START: "[MATCHING_START]",
	MATCHING_COMPLETE: "[MATCHING_COMPLETE]",
	MATCHING_ERROR: "[MATCHING_ERROR]",
	MATCHING_AI: "[MATCHING_AI]",
	MATCHING_FALLBACK: "[MATCHING_FALLBACK]",

	// Database Operations
	DB: "[DB]",
	DB_QUERY: "[DB_QUERY]",
	DB_INSERT: "[DB_INSERT]",
	DB_UPDATE: "[DB_UPDATE]",
	DB_DELETE: "[DB_DELETE]",
	DB_ERROR: "[DB_ERROR]",
	DB_SUCCESS: "[DB_SUCCESS]",

	// API Operations
	API: "[API]",
	API_REQUEST: "[API_REQUEST]",
	API_RESPONSE: "[API_RESPONSE]",
	API_ERROR: "[API_ERROR]",

	// Authentication
	AUTH: "[AUTH]",
	AUTH_SUCCESS: "[AUTH_SUCCESS]",
	AUTH_ERROR: "[AUTH_ERROR]",

	// Email Operations
	EMAIL: "[EMAIL]",
	EMAIL_SENT: "[EMAIL_SENT]",
	EMAIL_ERROR: "[EMAIL_ERROR]",

	// Validation
	VALIDATION: "[VALIDATION]",
	VALIDATION_SUCCESS: "[VALIDATION_SUCCESS]",
	VALIDATION_ERROR: "[VALIDATION_ERROR]",

	// Rate Limiting
	RATE_LIMIT: "[RATE_LIMIT]",
	RATE_LIMIT_EXCEEDED: "[RATE_LIMIT_EXCEEDED]",

	// Performance
	PERF: "[PERF]",
	PERF_SLOW: "[PERF_SLOW]",

	// Critical Operations
	CRITICAL: "[CRITICAL]",
	CRITICAL_ERROR: "[CRITICAL_ERROR]",
} as const;

/**
 * Helper function to create log messages with markers
 */
export function logWithMarker(
	marker: string,
	message: string,
	context?: Record<string, any>,
): string {
	const contextStr = context
		? ` ${JSON.stringify(context)}`
		: "";
	return `${marker} ${message}${contextStr}`;
}
