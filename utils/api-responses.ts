import { NextResponse } from "next/server";
import type { MatchResult } from "../app/api/match-users/handlers/types";

export function formatErrorResponse(
	error: unknown,
	code: string,
	status: number,
): NextResponse {
	const errorMessage = error instanceof Error ? error.message : String(error);

	return NextResponse.json(
		{
			error: errorMessage,
			code,
			timestamp: new Date().toISOString(),
		},
		{ status },
	);
}

export function formatSuccessResponse(
	results: MatchResult[],
	startTime: number,
	userCount: number,
): NextResponse {
	const processingTime = Date.now() - startTime;
	const totalMatches = results.reduce((sum, result) => sum + (result.matches || 0), 0);

	return NextResponse.json({
		success: true,
		data: {
			results,
			summary: {
				totalUsers: userCount,
				totalMatches,
				processingTime,
				averageMatchesPerUser: userCount > 0 ? totalMatches / userCount : 0,
			},
		},
		processingTime,
		timestamp: new Date().toISOString(),
	});
}

export function formatProcessingInProgressResponse(): NextResponse {
	return NextResponse.json(
		{
			error: "Processing in progress",
			code: "PROCESSING_IN_PROGRESS",
		},
		{ status: 409 },
	);
}