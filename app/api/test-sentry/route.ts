import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Test endpoint to verify Sentry integration
 * GET /api/test-sentry?type=exception|message
 *
 * This endpoint allows you to manually trigger Sentry events
 * to verify they're being captured and sent to Sentry.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || "exception";

	try {
		// Set context for this request
		Sentry.setContext("test_request", {
			timestamp: new Date().toISOString(),
			type,
			endpoint: "/api/test-sentry",
		});

		if (type === "exception") {
			// Test exception capture
			const testError = new Error("Sentry Test Exception - Manual Trigger");
			Sentry.captureException(testError, {
				tags: {
					test: true,
					test_type: "manual_exception",
					source: "api_endpoint",
				},
				extra: {
					requestUrl: request.url,
					userAgent: request.headers.get("user-agent"),
				},
			});

			// CRITICAL: Flush Sentry to ensure error is sent
			await Sentry.flush(2000);

			return NextResponse.json({
				success: true,
				message: "Test exception sent to Sentry",
				type: "exception",
				timestamp: new Date().toISOString(),
				sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
				environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
			});
		}

		if (type === "message") {
			// Test message capture
			Sentry.captureMessage("Sentry Test Message - Manual Trigger", {
				level: "info",
				tags: {
					test: true,
					test_type: "manual_message",
					source: "api_endpoint",
				},
				extra: {
					requestUrl: request.url,
					userAgent: request.headers.get("user-agent"),
				},
			});

			// CRITICAL: Flush Sentry to ensure message is sent
			await Sentry.flush(2000);

			return NextResponse.json({
				success: true,
				message: "Test message sent to Sentry",
				type: "message",
				timestamp: new Date().toISOString(),
				sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
				environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
			});
		}

		if (type === "config") {
			// Return Sentry configuration (without sensitive data)
			return NextResponse.json({
				sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
				hasServerDsn: !!process.env.SENTRY_DSN,
				hasClientDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
				environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
				nodeEnv: process.env.NODE_ENV,
				sentryDebug: process.env.SENTRY_DEBUG === "true",
				timestamp: new Date().toISOString(),
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: "Invalid type parameter. Use 'exception' or 'message'",
			},
			{ status: 400 },
		);
	} catch (error) {
		// Capture any errors in the test endpoint itself
		Sentry.captureException(
			error instanceof Error ? error : new Error(String(error)),
			{
				tags: {
					test: true,
					test_type: "endpoint_error",
				},
			},
		);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
