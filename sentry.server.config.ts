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
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

	// Enable debug mode in development or when SENTRY_DEBUG is set
	debug:
		process.env.SENTRY_DEBUG === "true" ||
		process.env.NODE_ENV === "development",

	// Only initialize if DSN is available (Vercel integration will provide this)
	enabled: isEnabled,
	
	// CRITICAL: For serverless, ensure we wait for events to be sent
	// Increase flush timeout to ensure events are sent before function terminates
	shutdownTimeout: 10000, // 10 seconds

	// Add beforeSend hook to log when events are sent (useful for debugging)
	beforeSend(event, hint) {
		// Always log in production for debugging
		console.log("[Sentry Server] ✅ Event captured (beforeSend):", {
			message: event.message,
			exception: event.exception?.values?.[0]?.value,
			level: event.level,
			environment: event.environment,
			tags: event.tags,
			eventId: event.event_id,
			timestamp: event.timestamp,
			willSend: true, // This event will be sent
		});
		
		// Log hint if available (contains original error)
		if (hint?.originalException) {
			console.log("[Sentry Server] Original exception:", {
				message: hint.originalException instanceof Error ? hint.originalException.message : String(hint.originalException),
				stack: hint.originalException instanceof Error ? hint.originalException.stack : undefined,
			});
		}
		
		// CRITICAL: Always return event (don't filter it out)
		// Returning null would prevent the event from being sent
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
