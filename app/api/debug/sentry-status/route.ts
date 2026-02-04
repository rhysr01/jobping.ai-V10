import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
	const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
	const isEnabled = !!dsn;
	
	const status = {
		enabled: isEnabled,
		dsn: dsn ? `${dsn.substring(0, 20)}...` : "NOT SET",
		environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
		hasSentryDSN: !!process.env.SENTRY_DSN,
		hasNextPublicSentryDSN: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
		vercelEnv: process.env.VERCEL_ENV,
		nodeEnv: process.env.NODE_ENV,
		timestamp: new Date().toISOString(),
	};

	// Test capture if enabled
	if (isEnabled) {
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
			status["testMessageSent"] = true;
		} catch (error) {
			status["testMessageError"] = error instanceof Error ? error.message : String(error);
		}
	}

	return NextResponse.json(status);
}
