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

			return NextResponse.json({
				success: true,
				message: "Test exception sent to Sentry",
				type: "exception",
				timestamp: new Date().toISOString(),
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

			return NextResponse.json({
				success: true,
				message: "Test message sent to Sentry",
				type: "message",
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
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				test: true,
				test_type: "endpoint_error",
			},
		});

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
