import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	const testId = `signup-test-${Date.now()}`;
	
	console.log("[SIGNUP TEST] Starting test", {
		testId,
		timestamp: new Date().toISOString(),
	});

	try {
		const body = await request.json();
		
		console.log("[SIGNUP TEST] Request body received", {
			testId,
			body,
			hasEmail: !!body.email,
			hasFullName: !!body.full_name,
			hasCities: !!body.cities,
			hasCareerPath: !!body.careerPath,
		});

		// Test Sentry capture
		Sentry.captureMessage(`Signup test ${testId}`, {
			level: "info",
			tags: {
				test: "true",
				testId,
			},
			extra: {
				testId,
				body,
				timestamp: new Date().toISOString(),
			},
		});

		await Sentry.flush(2000);

		return NextResponse.json({
			success: true,
			testId,
			message: "Signup test completed. Check console and Sentry.",
			receivedBody: body,
		});
	} catch (error) {
		const errorObj = error instanceof Error ? error : new Error(String(error));
		
		console.error("[SIGNUP TEST] Error", {
			testId,
			error: errorObj.message,
			stack: errorObj.stack,
		});

		Sentry.captureException(errorObj, {
			tags: {
				test: "true",
				testId,
			},
			extra: {
				testId,
				timestamp: new Date().toISOString(),
			},
		});

		await Sentry.flush(2000);

		return NextResponse.json({
			success: false,
			testId,
			error: errorObj.message,
			stack: errorObj.stack,
		}, { status: 500 });
	}
}
