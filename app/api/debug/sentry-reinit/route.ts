import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Force reinitialize Sentry with explicit DSN
 * This bypasses any initialization issues
 */
export async function GET(_request: NextRequest) {
	const testId = `reinit-${Date.now()}`;
	const results: any = {
		testId,
		timestamp: new Date().toISOString(),
		steps: [],
	};

	try {
		// Step 1: Get DSN from environment
		const envDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
		
		results.steps.push({
			step: "1. Get DSN",
			hasDsn: !!envDsn,
			dsnPrefix: envDsn ? `${envDsn.substring(0, 30)}...` : "NOT FOUND",
		});

		if (!envDsn) {
			return NextResponse.json({
				...results,
				error: "SENTRY_DSN not found in environment variables",
				message: "Add SENTRY_DSN to Vercel environment variables",
			}, { status: 500 });
		}

		// Step 2: Force reinitialize Sentry with explicit DSN
		console.log(`[SENTRY REINIT] Reinitializing Sentry with explicit DSN...`);
		
		// Close existing client if any
		const currentClient = Sentry.getCurrentHub().getClient();
		if (currentClient) {
			await currentClient.close(2000);
		}

		// Reinitialize with explicit configuration
		Sentry.init({
			dsn: envDsn,
			environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
			debug: true, // Always enable debug
			enabled: true, // Force enable
			tracesSampleRate: 1.0,
			sampleRate: 1.0, // Send 100% of events
			shutdownTimeout: 10000,
			beforeSend(event) {
				console.log("[SENTRY REINIT] ✅ Event captured:", {
					eventId: event.event_id,
					message: event.message,
					level: event.level,
				});
				return event;
			},
		});

		results.steps.push({
			step: "2. Reinitialize Sentry",
			success: true,
			dsn: `${envDsn.substring(0, 30)}...`,
			enabled: true,
			debug: true,
		});

		// Step 3: Test capture
		console.log(`[SENTRY REINIT] Testing capture...`);
		const eventId = Sentry.captureMessage(`Reinit test ${testId}`, {
			level: "error",
			tags: {
				test: "reinit",
				testId,
			},
		});

		results.steps.push({
			step: "3. Capture Message",
			eventId,
			success: !!eventId,
		});

		// Step 4: Flush
		console.log(`[SENTRY REINIT] Flushing...`);
		const flushResult = await Sentry.flush(10000);
		
		results.steps.push({
			step: "4. Flush",
			success: flushResult === true,
			flushResult,
		});

		return NextResponse.json({
			...results,
			success: true,
			message: "Sentry reinitialized and test event sent. Check Sentry dashboard.",
			instructions: [
				"1. Check Sentry dashboard for event with testId: " + testId,
				"2. Check Vercel logs for '[SENTRY REINIT]' messages",
				"3. If still not working, DSN might be invalid or Sentry project might have filters",
			],
		});

	} catch (error) {
		console.error("[SENTRY REINIT] Error:", error);
		return NextResponse.json({
			...results,
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		}, { status: 500 });
	}
}
