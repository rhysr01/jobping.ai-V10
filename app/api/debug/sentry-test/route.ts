import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const testId = `test-${Date.now()}`;
	
	console.log("[SENTRY TEST] Starting test", {
		testId,
		sentryDsn: process.env.SENTRY_DSN ? "SET" : "MISSING",
		nextPublicSentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? "SET" : "MISSING",
		environment: process.env.NODE_ENV,
		vercelEnv: process.env.VERCEL_ENV,
	});

	try {
		// Test 1: Capture a message
		Sentry.captureMessage(`Sentry test message ${testId}`, {
			level: "info",
			tags: {
				test: "true",
				testId,
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
				environment: process.env.NODE_ENV,
			},
		});

		// Test 2: Capture an exception
		const testError = new Error(`Sentry test error ${testId}`);
		Sentry.captureException(testError, {
			tags: {
				test: "true",
				testId,
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
			},
		});

		// Test 3: Flush and wait
		await Sentry.flush(3000);

		return NextResponse.json({
			success: true,
			testId,
			message: "Sentry test events sent. Check Sentry dashboard.",
			sentryDsn: process.env.SENTRY_DSN ? "CONFIGURED" : "MISSING",
			nextPublicSentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? "CONFIGURED" : "MISSING",
			environment: process.env.NODE_ENV,
		});
	} catch (error) {
		console.error("[SENTRY TEST] Error during test", error);
		return NextResponse.json({
			success: false,
			testId,
			error: error instanceof Error ? error.message : String(error),
			sentryDsn: process.env.SENTRY_DSN ? "CONFIGURED" : "MISSING",
		}, { status: 500 });
	}
}
