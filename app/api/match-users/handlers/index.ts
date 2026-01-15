/**
 * Main Route Handler - Orchestrates all matching logic
 */

import { type NextRequest } from "next/server";
import { authenticateRequest } from "@/middleware/api-auth";
import { validateMatchUsersRequest } from "@/middleware/api-validation";
import { matchUsersService } from "@/services/matchUsersService";

// Simple error classes to replace deleted files
export class JobFetchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "JobFetchError";
	}
}

export class UserFetchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UserFetchError";
	}
}

/**
 * Main match-users handler - Simplified using extracted services
 */
export async function matchUsersHandler(req: NextRequest) {
	const requestId = crypto.randomUUID();

	// Authenticate request
	const authResult = await authenticateRequest(req);
	if (!authResult.isAuthenticated) {
		return authResult.error!;
	}

	// Parse request body (avoid double consumption)
	let body;
	if (authResult.authenticatedReq?._rawBody) {
		// Use raw body from authenticated request to avoid double consumption
		body = JSON.parse(authResult.authenticatedReq._rawBody);
	} else {
		// Fallback for requests without authentication
		body = await req.json();
	}

	// Validate request
	const validationResult = validateMatchUsersRequest(body);
	if (!validationResult.isValid) {
		return validationResult.error!;
	}

	const { userLimit, jobLimit, signature, timestamp } = validationResult.data!;

	// Extract IP address
	const ip =
		req.headers.get("x-forwarded-for") ||
		req.headers.get("x-real-ip") ||
		"unknown";

	// Process the match users request
	return matchUsersService.processMatchUsersRequest({
		userLimit,
		jobLimit,
		signature,
		timestamp,
		ip,
		requestId,
	});
}
