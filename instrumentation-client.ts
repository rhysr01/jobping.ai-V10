// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const isEnabled = !!dsn;

// Determine environment (production, preview, development)
const getEnvironment = () => {
	if (typeof window !== "undefined" && (window as any).__VERCEL_ENV) {
		return (window as any).__VERCEL_ENV;
	}
	// Check if we're in production build
	if (process.env.NODE_ENV === "production") {
		return "production";
	}
	return "development";
};

Sentry.init({
	dsn,

	// Set environment for proper filtering in Sentry dashboard
	environment: getEnvironment(),

	// Adjust this value in production, or use tracesSampler for greater control
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

	// Enable debug mode in development or when SENTRY_DEBUG is set
	debug: process.env.SENTRY_DEBUG === "true" || process.env.NODE_ENV === "development",

	replaysOnErrorSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production
	replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

	// You can remove this option if you're not planning to use the Sentry Session Replay feature:
	integrations: [
		Sentry.replayIntegration({
			// Additional Replay configuration goes in here, for example:
			maskAllText: true,
			blockAllMedia: true,
		}),
	],

	// Only initialize if DSN is available (Vercel integration will provide this)
	enabled: isEnabled,

	// Add beforeSend hook to log when events are sent (useful for debugging)
	beforeSend(event) {
		if (process.env.SENTRY_DEBUG === "true" || process.env.NODE_ENV === "development") {
			console.log("[Sentry Client] Event captured:", {
				message: event.message,
				exception: event.exception,
				level: event.level,
				environment: event.environment,
			});
		}
		return event;
	},
});

if (isEnabled && typeof window !== "undefined") {
	console.log(`[Sentry Client] Initialized for environment: ${getEnvironment()}`);
}

// Export the required hooks for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
