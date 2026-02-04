import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
	// Check all possible DSN sources (Vercel integration might use different names)
	const envDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
	const hasAuthToken = !!process.env.SENTRY_AUTH_TOKEN;
	const dsn = envDsn || (hasAuthToken ? "SET_VIA_VERCEL_INTEGRATION" : null);
	
	const isEnabled = !!dsn || hasAuthToken;
	
	// Check if Sentry is actually initialized and enabled
	// Note: Sentry Next.js doesn't expose getCurrentHub, so we check via DSN availability
	const sentryInitialized = typeof Sentry !== "undefined" && typeof Sentry.captureMessage === "function";
	const sentryEnabled = isEnabled && sentryInitialized;
	
	const dsnDisplay = dsn 
		? (dsn === "SET_VIA_VERCEL_INTEGRATION" 
			? "SET_VIA_VERCEL_INTEGRATION" 
			: `${dsn.substring(0, 20)}...`)
		: "NOT SET";
	
	const status: Record<string, any> = {
		enabled: isEnabled,
		sentryEnabled, // Actual runtime enabled status
		dsn: dsnDisplay,
		environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
		hasSentryDSN: !!process.env.SENTRY_DSN,
		hasNextPublicSentryDSN: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
		hasSentryAuthToken: !!process.env.SENTRY_AUTH_TOKEN,
		hasSentryOrg: !!process.env.SENTRY_ORG,
		hasSentryProject: !!process.env.SENTRY_PROJECT,
		sentryInitialized,
		vercelEnv: process.env.VERCEL_ENV,
		nodeEnv: process.env.NODE_ENV,
		timestamp: new Date().toISOString(),
		note: "If using Vercel Sentry integration, DSN may be injected at build time only. Check Sentry dashboard for events.",
	};

	// Test capture if Sentry is initialized AND enabled (even if DSN not visible at runtime)
	if (sentryInitialized && sentryEnabled) {
		try {
			Sentry.captureMessage("Sentry status check", {
				level: "info",
				tags: {
					endpoint: "sentry-status",
					test: "true",
				},
				extra: status,
			});
			await Sentry.flush(2000);
			status.testMessageSent = true;
			status.testMessageNote = "Event sent - check Sentry dashboard";
		} catch (error) {
			status.testMessageError = error instanceof Error ? error.message : String(error);
		}
	} else {
		status.testMessageNote = "Sentry not initialized - DSN may not be available at runtime";
	}

	return NextResponse.json(status);
}
