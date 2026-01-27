// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
	debug: process.env.SENTRY_DEBUG === "true" || process.env.NODE_ENV === "development",

	// Only initialize if DSN is available (Vercel integration will provide this)
	enabled: isEnabled,

	// Add beforeSend hook to log when events are sent (useful for debugging)
	beforeSend(event) {
		if (process.env.SENTRY_DEBUG === "true" || process.env.NODE_ENV === "development") {
			console.log("[Sentry Edge] Event captured:", {
				message: event.message,
				exception: event.exception,
				level: event.level,
				environment: event.environment,
			});
		}
		return event;
	},
});

if (isEnabled) {
	console.log(`[Sentry Edge] Initialized for environment: ${getEnvironment()}`);
} else {
	console.warn("[Sentry Edge] DSN not found - Sentry is disabled");
}
