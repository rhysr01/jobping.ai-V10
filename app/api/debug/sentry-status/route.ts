import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
	// Check all possible DSN sources (Vercel integration might use different names)
	const dsn = 
		process.env.SENTRY_DSN || 
		process.env.NEXT_PUBLIC_SENTRY_DSN ||
		process.env.SENTRY_AUTH_TOKEN ? "SET_VIA_VERCEL_INTEGRATION" : null;
	
	const isEnabled = !!dsn || !!process.env.SENTRY_AUTH_TOKEN;
	
	// Check if Sentry is actually initialized (would mean DSN was available at build time)
	const sentryInitialized = typeof Sentry !== "undefined" && Sentry.getCurrentHub;
	
	const status: Record<string, any> = {
		enabled: isEnabled,
		dsn: dsn ? (dsn === "SET_VIA_VERCEL_INTEGRATION" ? "SET_VIA_VERCEL_INTEGRATION" : `${dsn.substring(0, 20)}...`) : "NOT SET",
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

	// Test capture if Sentry is initialized (even if DSN not visible at runtime)
	if (sentryInitialized) {
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
