// Recent matches API for social proof ticker
// Returns a sample recent match for display

import { type NextRequest, NextResponse } from "next/server";
import { createSuccessResponse } from "../../../lib/api-response";
import { apiLogger } from "../../../lib/api-logger";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
	const requestId = req.headers.get("x-request-id") || "unknown";

	try {
		// Return a sample recent match for social proof
		// In production, this would fetch from database
		const recentMatch = {
			city: "London",
			count: 3,
			minutesAgo: Math.floor(Math.random() * 30) + 1, // 1-30 minutes ago
		};

		apiLogger.info("Recent matches API called", { requestId });

		const response = NextResponse.json(
			createSuccessResponse(recentMatch, "Recent match retrieved successfully"),
			{ status: 200 }
		);
		response.headers.set("x-request-id", requestId);

		return response;
	} catch (error) {
		apiLogger.error("Failed to fetch recent matches", error as Error, {
			requestId,
		});

		return NextResponse.json(
			{
				error: "Failed to fetch recent matches",
				message: "Internal server error",
			},
			{ status: 500 }
		);
	}
};