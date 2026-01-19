import { NextRequest, NextResponse } from "next/server";

/**
 * Analytics tracking endpoint
 * Stores user interaction events for analytics
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { event, properties, timestamp, url } = body;

		// For now, just log the event (you can integrate with your analytics service later)
		const userAgent = request.headers.get("user-agent");
		const ip =
			request.headers.get("x-forwarded-for") ||
			request.headers.get("x-real-ip");

		console.log("[Analytics]", {
			event,
			properties,
			timestamp,
			url,
			userAgent,
			ip,
		});

		// TODO: Store in database or send to analytics service
		// For production, you might want to:
		// 1. Store in Supabase analytics table
		// 2. Send to Google Analytics 4
		// 3. Send to PostHog or other analytics service

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Analytics API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to track event" },
			{ status: 500 },
		);
	}
}
