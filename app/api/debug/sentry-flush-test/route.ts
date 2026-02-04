import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Comprehensive Sentry flush test endpoint
 * Tests if Sentry is properly flushing events in serverless environment
 */
export async function GET(_request: NextRequest) {
	const testId = `flush-test-${Date.now()}`;
	const results: Record<string, any> = {
		testId,
		timestamp: new Date().toISOString(),
	};

	try {
		// Check Sentry initialization
		const hasSentry = typeof Sentry !== "undefined" && typeof Sentry.captureMessage === "function";
		const envDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
		const isEnabled = !!envDsn && hasSentry;

		results.sentryCheck = {
			hasSentry,
			isEnabled,
			hasDsn: !!envDsn,
			dsnPrefix: envDsn ? `${envDsn.substring(0, 20)}...` : "NONE",
		};

		if (!isEnabled) {
			return NextResponse.json({
				...results,
				error: "Sentry is not enabled",
				message: "Check SENTRY_DSN environment variable",
			}, { status: 500 });
		}

		// Test 1: Capture message
		console.log(`[SENTRY FLUSH TEST] Capturing message: ${testId}`);
		const messageId = Sentry.captureMessage(`Flush test message ${testId}`, {
			level: "info",
			tags: {
				test: "flush-test",
				testId,
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
			},
		});
		results.messageCapture = {
			eventId: messageId,
			success: !!messageId,
		};

		// Test 2: Capture exception
		console.log(`[SENTRY FLUSH TEST] Capturing exception: ${testId}`);
		const testError = new Error(`Flush test error ${testId}`);
		const exceptionId = Sentry.captureException(testError, {
			tags: {
				test: "flush-test",
				testId,
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
			},
		});
		results.exceptionCapture = {
			eventId: exceptionId,
			success: !!exceptionId,
		};

		// Test 3: Flush with extended timeout
		console.log(`[SENTRY FLUSH TEST] Flushing Sentry (timeout: 5000ms)...`);
		const flushStart = Date.now();
		const flushResult = await Sentry.flush(5000); // 5 second timeout
		const flushDuration = Date.now() - flushStart;

		results.flush = {
			success: flushResult === true,
			duration: `${flushDuration}ms`,
			result: flushResult,
			note: flushResult === true 
				? "Events flushed successfully" 
				: "Flush timed out or failed - events may still be queued",
		};

		// Log results
		console.log(`[SENTRY FLUSH TEST] Results:`, results);

		return NextResponse.json({
			...results,
			success: true,
			message: "Sentry flush test completed. Check Sentry dashboard for events.",
			instructions: [
				"1. Check Sentry dashboard for events with testId: " + testId,
				"2. Look for both message and exception events",
				"3. If flushResult is false, events may still be queued",
				"4. Check Vercel logs for '[Sentry Server] Event captured' messages",
			],
		});

	} catch (error) {
		console.error("[SENTRY FLUSH TEST] Error:", error);
		return NextResponse.json({
			...results,
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		}, { status: 500 });
	}
}
