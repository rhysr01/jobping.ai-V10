import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Direct Sentry test - bypasses all abstractions
 * This test directly uses Sentry SDK to verify events are being sent
 */
export async function GET(_request: NextRequest) {
	const testId = `direct-${Date.now()}`;
	const results: any = {
		testId,
		timestamp: new Date().toISOString(),
		steps: [],
	};

	try {
		// Step 1: Check environment variables
		const envDsn = process.env.SENTRY_DSN;
		const envNextPublicDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
		const hasDsn = !!(envDsn || envNextPublicDsn);
		
		results.steps.push({
			step: "1. Environment Check",
			hasSentryDSN: !!envDsn,
			hasNextPublicSentryDSN: !!envNextPublicDsn,
			hasAnyDsn: hasDsn,
			dsnPrefix: envDsn ? `${envDsn.substring(0, 30)}...` : envNextPublicDsn ? `${envNextPublicDsn.substring(0, 30)}...` : "NONE",
		});

		if (!hasDsn) {
			return NextResponse.json({
				...results,
				error: "No DSN found in environment variables",
				message: "Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN in Vercel environment variables",
			}, { status: 500 });
		}

		// Step 2: Check if Sentry is initialized
		const hasSentry = typeof Sentry !== "undefined";
		const hasCaptureMessage = typeof Sentry.captureMessage === "function";
		const hasCaptureException = typeof Sentry.captureException === "function";
		const hasFlush = typeof Sentry.flush === "function";

		results.steps.push({
			step: "2. Sentry SDK Check",
			hasSentry,
			hasCaptureMessage,
			hasCaptureException,
			hasFlush,
			allPresent: hasSentry && hasCaptureMessage && hasCaptureException && hasFlush,
		});

		if (!hasSentry || !hasCaptureMessage) {
			return NextResponse.json({
				...results,
				error: "Sentry SDK not properly initialized",
			}, { status: 500 });
		}

		// Step 3: Capture a message directly
		console.log(`[SENTRY DIRECT TEST] Step 3: Capturing message ${testId}`);
		const messageEventId = Sentry.captureMessage(`Direct test message ${testId}`, {
			level: "error", // Use error level to ensure it's not filtered
			tags: {
				test: "direct-test",
				testId,
				source: "api-direct-test",
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
				environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
			},
		});

		results.steps.push({
			step: "3. Capture Message",
			eventId: messageEventId,
			success: !!messageEventId,
		});

		// Step 4: Capture an exception directly
		console.log(`[SENTRY DIRECT TEST] Step 4: Capturing exception ${testId}`);
		const testError = new Error(`Direct test error ${testId}`);
		testError.name = "DirectTestError";
		const exceptionEventId = Sentry.captureException(testError, {
			tags: {
				test: "direct-test",
				testId,
				source: "api-direct-test",
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
				environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
			},
			level: "error",
		});

		results.steps.push({
			step: "4. Capture Exception",
			eventId: exceptionEventId,
			success: !!exceptionEventId,
		});

		// Step 5: Flush with extended timeout
		console.log(`[SENTRY DIRECT TEST] Step 5: Flushing Sentry (timeout: 10000ms)...`);
		const flushStart = Date.now();
		const flushResult = await Sentry.flush(10000); // 10 second timeout
		const flushDuration = Date.now() - flushStart;

		results.steps.push({
			step: "5. Flush Sentry",
			success: flushResult === true,
			duration: `${flushDuration}ms`,
			flushResult,
			note: flushResult === true 
				? "✅ Events flushed successfully" 
				: "⚠️ Flush returned false - events may still be queued",
		});

		// Step 6: Log everything for debugging
		console.log(`[SENTRY DIRECT TEST] Complete results:`, JSON.stringify(results, null, 2));

		return NextResponse.json({
			...results,
			success: true,
			summary: {
				dsnFound: hasDsn,
				sentryInitialized: hasSentry && hasCaptureMessage,
				messageCaptured: !!messageEventId,
				exceptionCaptured: !!exceptionEventId,
				flushSuccess: flushResult === true,
			},
			instructions: [
				"1. Check Sentry dashboard for events with testId: " + testId,
				"2. Filter by environment: " + (process.env.VERCEL_ENV || process.env.NODE_ENV || "production"),
				"3. Look for tags: test=direct-test",
				"4. If flushResult is false, check Vercel logs for '[Sentry Server] Event captured'",
				"5. If events don't appear, check Sentry project settings for filters",
			],
			vercelLogs: "Check Vercel logs for '[Sentry Server] ✅ Event captured (beforeSend)' messages",
		});

	} catch (error) {
		console.error("[SENTRY DIRECT TEST] Error:", error);
		results.steps.push({
			step: "ERROR",
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Try to capture the error itself
		try {
			Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
				tags: {
					test: "direct-test-error",
					testId,
				},
			});
			await Sentry.flush(5000);
		} catch (sentryError) {
			console.error("[SENTRY DIRECT TEST] Failed to capture error:", sentryError);
		}

		return NextResponse.json({
			...results,
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		}, { status: 500 });
	}
}
