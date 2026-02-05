// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isEnabled = !!dsn;

// Determine environment (production, preview, development)
const getEnvironment = () => {
	if (process.env.VERCEL_ENV) {
		return process.env.VERCEL_ENV; // production, preview, or development
	}
	return process.env.NODE_ENV === "production" ? "production" : "development";
};

Sentry.init({
	dsn,

	// Set environment for proper filtering in Sentry dashboard
	environment: getEnvironment(),

	// Adjust this value in production, or use tracesSampler for greater control
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1, // Reduce tracing in production

	// Enable debug mode only in development or when explicitly requested
	debug: process.env.NODE_ENV === "development" || process.env.SENTRY_DEBUG === "true",

	// Only initialize if DSN is available (Vercel integration will provide this)
	enabled: isEnabled,
	
	// For serverless, reduce timeout to prevent hanging
	shutdownTimeout: 2000, // 2 seconds
	
	// CRITICAL: Set maxBreadcrumbs to ensure we capture context
	maxBreadcrumbs: 50,
	
	// CRITICAL: Don't sample out any events in production (for debugging)
	sampleRate: 1.0, // Send 100% of events

	// Add beforeSend hook to log when events are sent (only in development)
	beforeSend(event) {
		// Only log in development to reduce noise
		if (process.env.NODE_ENV === "development") {
			console.log("[Sentry Server] Event captured:", {
				message: event.message,
				exception: event.exception?.values?.[0]?.value,
				level: event.level,
			});
		}
		
		// Always return event (don't filter it out)
		return event;
	},
});

if (isEnabled) {
	console.log(
		`[Sentry Server] ✅ Initialized for environment: ${getEnvironment()}`,
	);
	console.log(`[Sentry Server] DSN: ${dsn.substring(0, 30)}...`);
	console.log(`[Sentry Server] Debug mode: ${process.env.SENTRY_DEBUG === "true" || process.env.NODE_ENV === "development"}`);
} else {
	console.warn("[Sentry Server] ❌ DSN not found - Sentry is disabled");
	console.warn("[Sentry Server] Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN to enable");
}
