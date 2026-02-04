/**
 * Unified Error Handling for JobPing
 * Centralizes error handling across all API routes
 */

import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { logger } from "./monitoring";

// Request ID helper (for consistent request tracking)
export function getRequestId(req: NextRequest): string {
	const headerVal = req.headers.get("x-request-id");
	if (headerVal && headerVal.length > 0) {
		return headerVal;
	}

	// Generate request ID
	try {
		// eslint-disable-next-line
		const nodeCrypto = require("node:crypto");
		return nodeCrypto.randomUUID
			? nodeCrypto.randomUUID()
			: nodeCrypto.randomBytes(16).toString("hex");
	} catch {
		return Math.random().toString(36).slice(2) + Date.now().toString(36);
	}
}

export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public code?: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, 400, "VALIDATION_ERROR", details);
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 404, "NOT_FOUND");
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401, "UNAUTHORIZED");
	}
}

export class RateLimitError extends AppError {
	constructor(retryAfter?: number) {
		super("Rate limit exceeded", 429, "RATE_LIMIT", { retryAfter });
	}
}

/**
 * Centralized error handler
 * Logs errors and returns consistent JSON response with requestId
 * CRITICAL: Always captures errors to Sentry for monitoring
 */
export function handleError(error: unknown, req?: NextRequest): NextResponse {
	const requestId = req ? getRequestId(req) : undefined;
	const errorObj = error instanceof Error ? error : new Error(String(error));

	// CRITICAL: Always capture to Sentry, even for AppErrors
	// This ensures we see ALL errors in production
	Sentry.captureException(errorObj, {
		tags: {
			error_handler: "asyncHandler",
			error_type: error instanceof AppError ? error.code || "AppError" : "UnknownError",
			endpoint: req?.url || "unknown",
		},
		extra: {
			requestId,
			statusCode: error instanceof AppError ? error.statusCode : 500,
			code: error instanceof AppError ? error.code : undefined,
			details: error instanceof AppError ? error.details : undefined,
		},
		level: error instanceof AppError && error.statusCode < 500 ? "warning" : "error",
	});

	if (error instanceof AppError) {
		logger.warn(error.message, {
			metadata: {
				statusCode: error.statusCode,
				code: error.code,
				details: error.details,
				requestId,
			},
		});

		const response = NextResponse.json(
			{
				error: error.message,
				code: error.code,
				details: error.details,
				...(requestId && { requestId }),
			},
			{ status: error.statusCode },
		);

		if (requestId) {
			response.headers.set("x-request-id", requestId);
		}

		return response;
	}

	// Unknown error - log with full stack
	logger.error("Unhandled error", {
		error: errorObj,
	});

	const response = NextResponse.json(
		{
			error: "Internal server error",
			...(requestId && { requestId }),
		},
		{ status: 500 },
	);

	if (requestId) {
		response.headers.set("x-request-id", requestId);
	}

	return response;
}

/**
 * Async handler wrapper - wraps API route handlers
 * Automatically catches and handles all errors
 *
 * Usage:
 * export const POST = asyncHandler(async (req) => {
 *   // Your code here
 *   // Errors are auto-caught and handled
 * });
 */
export function asyncHandler(
	handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
) {
	return async (req: NextRequest, context?: any) => {
		const requestId = getRequestId(req);
		
		// CRITICAL: Log handler entry to catch silent failures
		console.log("[asyncHandler] Handler invoked", {
			requestId,
			url: req.url,
			method: req.method,
			timestamp: new Date().toISOString(),
		});
		
		try {
			const result = await handler(req, context);
			
			// Log successful completion
			console.log("[asyncHandler] Handler completed successfully", {
				requestId,
				status: result.status,
			});
			
			return result;
		} catch (error) {
			// CRITICAL: Log error before handling to catch silent failures
			console.error("[asyncHandler] Error caught", {
				requestId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				timestamp: new Date().toISOString(),
			});
			
			return handleError(error, req);
		}
	};
}
