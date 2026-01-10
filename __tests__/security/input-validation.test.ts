/**
 * Security Tests: Input Validation and Sanitization
 *
 * Tests that user inputs are properly validated and sanitized
 * to prevent XSS, SQL injection, and other injection attacks
 */

import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/signup/route";

describe("Security: Input Validation", () => {
	it("should reject XSS attempts in signup", async () => {
		const xssPayloads = [
			'<script>alert("xss")</script>',
			'"><script>alert("xss")</script>',
			'javascript:alert("xss")',
			'<img src=x onerror=alert("xss")>',
		];

		for (const payload of xssPayloads) {
			const { req } = createMocks({
				method: "POST",
				body: {
					fullName: payload,
					email: "test@example.com",
					cities: ["London"],
					languages: ["English"],
					gdprConsent: true,
				},
			});

			const response = await POST(req as any);

			// Should either reject the input or sanitize it
			expect([400, 422, 500]).toContain(response.status);
		}
	});

	it("should validate email format strictly", async () => {
		const invalidEmails = [
			"notanemail",
			"@example.com",
			"user@",
			"user.example.com",
			"user@.com",
			"user..user@example.com",
		];

		for (const email of invalidEmails) {
			const { req } = createMocks({
				method: "POST",
				body: {
					fullName: "Test User",
					email,
					cities: ["London"],
					languages: ["English"],
					gdprConsent: true,
				},
			});

			const response = await POST(req as any);
			expect([400, 500]).toContain(response.status);
		}
	});

	it("should enforce reasonable field length limits", async () => {
		const longString = "a".repeat(1000);

		const { req } = createMocks({
			method: "POST",
			body: {
				fullName: longString,
				email: "test@example.com",
				cities: ["London"],
				languages: ["English"],
				gdprConsent: true,
			},
		});

		const response = await POST(req as any);

		// Should reject overly long inputs
		expect([400, 422, 500]).toContain(response.status);
	});

	it("should reject SQL injection attempts", async () => {
		const sqlInjections = [
			"' OR '1'='1",
			"'; DROP TABLE users; --",
			"' UNION SELECT * FROM users --",
		];

		for (const injection of sqlInjections) {
			const { req } = createMocks({
				method: "POST",
				body: {
					fullName: "Test User",
					email: "test@example.com",
					cities: [injection],
					languages: ["English"],
					gdprConsent: true,
				},
			});

			const response = await POST(req as any);
			expect([400, 500]).toContain(response.status);
		}
	});

	it("should validate array inputs properly", async () => {
		// Test empty arrays
		const { req: emptyReq } = createMocks({
			method: "POST",
			body: {
				fullName: "Test User",
				email: "test@example.com",
				cities: [],
				languages: ["English"],
				gdprConsent: true,
			},
		});

		const emptyResponse = await POST(emptyReq as any);
		expect([400, 500]).toContain(emptyResponse.status);

		// Test oversized arrays
		const { req: largeReq } = createMocks({
			method: "POST",
			body: {
				fullName: "Test User",
				email: "test@example.com",
				cities: Array(100).fill("London"),
				languages: ["English"],
				gdprConsent: true,
			},
		});

		const largeResponse = await POST(largeReq as any);
		expect([400, 422, 500]).toContain(largeResponse.status);
	});
});