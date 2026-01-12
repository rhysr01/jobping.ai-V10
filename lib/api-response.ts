/**
 * Centralized API Response Utilities - DRY Principle Implementation
 * Consolidates duplicate error response patterns across all API routes
 */

import { NextResponse } from "next/server";
import { apiLogger } from "./api-logger";

export interface APIError {
	message: string;
	code?: string;
	details?: any;
	status?: number;
}

export interface APISuccess<T = any> {
	data: T;
	message?: string;
	meta?: {
		count?: number;
		total?: number;
		page?: number;
		limit?: number;
	};
}

/**
 * Standard error response format
 */
export function createErrorResponse(
	error: APIError | Error | string,
	status: number = 500,
	requestId?: string
): NextResponse {
	const errorObj: APIError = typeof error === 'string'
		? { message: error, status }
		: error instanceof Error
			? { message: error.message, status, details: error.stack }
			: { ...error, status: error.status || status };

	// Log error
	apiLogger.error("API Error Response", new Error(errorObj.message), {
		...(errorObj.code && { code: errorObj.code }),
		status: errorObj.status,
		requestId,
		details: errorObj.details
	});

	return NextResponse.json(
		{
			error: {
				message: errorObj.message,
				code: errorObj.code,
			},
			timestamp: new Date().toISOString(),
		},
		{ status: errorObj.status || status }
	);
}

/**
 * Standard success response format
 */
export function createSuccessResponse<T = any>(
	data: T,
	message?: string,
	meta?: APISuccess['meta'],
	status: number = 200
): NextResponse {
	const response: APISuccess<T> = {
		data,
		...(message && { message }),
		...(meta && { meta }),
	};

	return NextResponse.json(response, { status });
}

/**
 * Validation error response
 */
export function createValidationError(
	errors: Record<string, string>,
	message: string = "Validation failed"
): NextResponse {
	return createErrorResponse({
		message,
		code: "VALIDATION_ERROR",
		details: errors,
		status: 400
	}, 400);
}

/**
 * Not found error response
 */
export function createNotFoundError(
	resource: string,
	identifier?: string
): NextResponse {
	const message = identifier
		? `${resource} not found: ${identifier}`
		: `${resource} not found`;

	return createErrorResponse({
		message,
		code: "NOT_FOUND",
		status: 404
	}, 404);
}

/**
 * Rate limit error response
 */
export function createRateLimitError(
	retryAfter: number,
	message: string = "Too many requests"
): NextResponse {
	const response = createErrorResponse({
		message,
		code: "RATE_LIMIT_EXCEEDED",
		details: { retryAfter },
		status: 429
	}, 429);

	response.headers.set("Retry-After", retryAfter.toString());
	return response;
}

/**
 * Authentication error response
 */
export function createAuthError(
	message: string = "Authentication required"
): NextResponse {
	return createErrorResponse({
		message,
		code: "AUTHENTICATION_REQUIRED",
		status: 401
	}, 401);
}

/**
 * Authorization error response
 */
export function createForbiddenError(
	message: string = "Insufficient permissions"
): NextResponse {
	return createErrorResponse({
		message,
		code: "FORBIDDEN",
		status: 403
	}, 403);
}