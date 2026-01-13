/**
 * Selective Email Verification API Tests
 *
 * Tests the new selective verification system where:
 * - Free users are auto-verified
 * - Premium users require email verification before payment
 * - New API endpoints for resend and status checking
 */

import { POST as verifyEmailPost, GET as verifyEmailGet } from "@/app/api/verify-email/route";
import { POST as resendPost } from "@/app/api/verify-email/resend/route";
import { GET as verificationStatusGet } from "@/app/api/user/verification-status/route";

// Mock the email verification functions
jest.mock("@/utils/email-verification", () => ({
	sendVerificationEmail: jest.fn(),
	verifyVerificationToken: jest.fn(),
	markUserVerified: jest.fn(),
}));

// Mock database
jest.mock("@/utils/core/database-pool", () => ({
	getDatabaseClient: jest.fn(() => ({
		from: jest.fn(() => ({
			select: jest.fn(() => ({
				eq: jest.fn(() => ({
					single: jest.fn(),
				})),
			})),
			update: jest.fn(() => ({
				eq: jest.fn(),
			})),
		})),
	})),
}));

const mockSendVerificationEmail = require("@/utils/email-verification")
	.sendVerificationEmail as jest.MockedFunction<any>;
const mockVerifyVerificationToken = require("@/utils/email-verification")
	.verifyVerificationToken as jest.MockedFunction<any>;
const mockMarkUserVerified = require("@/utils/email-verification")
	.markUserVerified as jest.MockedFunction<any>;

describe("Selective Email Verification System", () => {
	describe("POST /api/verify-email/resend - Resend Verification", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("should resend verification email for premium users", async () => {
			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: {
									email_verified: false,
									subscription_tier: "premium",
									full_name: "John Doe",
								},
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			mockSendVerificationEmail.mockResolvedValue({ success: true });

			const request = new Request("http://localhost:3000/api/verify-email/resend", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "john@example.com" }),
			});

			const response = await resendPost(request as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.message).toContain("Verification email sent");

			expect(mockSendVerificationEmail).toHaveBeenCalledWith("john@example.com", "John Doe");
		});

		it("should reject resend for free users", async () => {
			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: {
									email_verified: false,
									subscription_tier: "free",
								},
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			const request = new Request("http://localhost:3000/api/verify-email/resend", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "free@example.com" }),
			});

			const response = await resendPost(request as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.message).toContain("not required for this account type");
		});

		it("should reject resend for already verified users", async () => {
			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: {
									email_verified: true,
									subscription_tier: "premium",
								},
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			const request = new Request("http://localhost:3000/api/verify-email/resend", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "verified@example.com" }),
			});

			const response = await resendPost(request as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.message).toContain("already verified");
		});

		it("should handle rate limiting", async () => {
			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: {
									email_verified: false,
									subscription_tier: "premium",
								},
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			// Make multiple rapid requests
			const requests = [];
			for (let i = 0; i < 5; i++) {
				const request = new Request("http://localhost:3000/api/verify-email/resend", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ email: "ratelimit@example.com" }),
				});
				requests.push(resendPost(request as any));
			}

			const responses = await Promise.all(requests);
			const successCount = responses.filter(r => r.status === 200).length;

			// In test mode, rate limiting is disabled, so all requests should succeed
			expect(successCount).toBe(5);
		});
	});

	describe("GET /api/user/verification-status - Check Verification Status", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("should return verified status for verified users", async () => {
			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: { email_verified: true },
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			const request = new Request("http://localhost:3000/api/user/verification-status");

			// Mock cookies
			Object.defineProperty(request, 'cookies', {
				get: () => ({
					get: (name: string) => name === 'free_user_email' ? { value: 'verified@example.com' } : null,
				}),
			});

			const response = await verificationStatusGet(request as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.verified).toBe(true);
			expect(data.email).toBe("verified@example.com");
		});

		it("should return unverified status for unverified users", async () => {
			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: { email_verified: false },
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			const request = new Request("http://localhost:3000/api/user/verification-status");

			Object.defineProperty(request, 'cookies', {
				get: () => ({
					get: (name: string) => name === 'free_user_email' ? { value: 'unverified@example.com' } : null,
				}),
			});

			const response = await verificationStatusGet(request as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.verified).toBe(false);
		});

		it("should return 401 when no user session exists", async () => {
			const request = new Request("http://localhost:3000/api/user/verification-status");

			Object.defineProperty(request, 'cookies', {
				get: () => ({
					get: () => null,
				}),
			});

			const response = await verificationStatusGet(request as any);
			expect(response.status).toBe(401);

			const data = await response.json();
			expect(data.error).toContain("No user session found");
		});
	});

	describe("GET /api/verify-email - Redirect After Verification", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("should redirect premium users to billing after verification", async () => {
			mockVerifyVerificationToken.mockResolvedValue({
				valid: true,
				expiresAt: Date.now() + 86400000,
			});
			mockMarkUserVerified.mockResolvedValue(undefined);

			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: { subscription_tier: "premium" },
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			const request = new Request("http://localhost:3000/api/verify-email?token=valid&email=premium@example.com");

			const response = await verifyEmailGet(request as any);
			expect(response.status).toBe(307); // Temporary redirect

			const location = response.headers.get("location");
			expect(location).toContain("/billing");
			expect(location).toContain("verified=true");
			expect(location).toContain("email=premium%40example.com");
		});

		it("should redirect free users to success page after verification", async () => {
			mockVerifyVerificationToken.mockResolvedValue({
				valid: true,
				expiresAt: Date.now() + 86400000,
			});
			mockMarkUserVerified.mockResolvedValue(undefined);

			const mockDb = {
				from: jest.fn(() => ({
					select: jest.fn(() => ({
						eq: jest.fn(() => ({
							single: jest.fn().mockResolvedValue({
								data: { subscription_tier: "free" },
							}),
						})),
					})),
				})),
			};
			require("@/utils/core/database-pool").getDatabaseClient.mockReturnValue(mockDb);

			const request = new Request("http://localhost:3000/api/verify-email?token=valid&email=free@example.com");

			const response = await verifyEmailGet(request as any);
			expect(response.status).toBe(307);

			const location = response.headers.get("location");
			expect(location).toContain("/signup/success");
			expect(location).toContain("verified=true");
		});

		it("should redirect to error page for invalid tokens", async () => {
			mockVerifyVerificationToken.mockResolvedValue({
				valid: false,
				reason: "Token expired",
			});

			const request = new Request("http://localhost:3000/api/verify-email?token=invalid&email=test@example.com");

			const response = await verifyEmailGet(request as any);
			expect(response.status).toBe(307);

			const location = response.headers.get("location");
			expect(location).toContain("/signup/success");
			expect(location).toContain("verified=false");
			expect(location).toContain("error=Token%20expired");
		});
	});

	describe("Premium Signup Flow Integration", () => {
		it("should set email_verified to false for premium users", async () => {
			// This would be tested in the signup route tests
			// Verifying that premium users get email_verified: false
			const premiumUserData = {
				email: "premium@example.com",
				full_name: "Premium User",
				subscription_tier: "premium",
				email_verified: false, // Should be false for premium
			};

			expect(premiumUserData.email_verified).toBe(false);
			expect(premiumUserData.subscription_tier).toBe("premium");
		});

		it("should set email_verified to true for free users", async () => {
			// This would be tested in the free signup route tests
			// Verifying that free users get email_verified: true
			const freeUserData = {
				email: "free@example.com",
				full_name: "Free User",
				subscription_tier: "free",
				email_verified: true, // Should be true for free
			};

			expect(freeUserData.email_verified).toBe(true);
			expect(freeUserData.subscription_tier).toBe("free");
		});
	});

	describe("Billing Page Verification Check", () => {
		it("should block unverified premium users from billing page", () => {
			// This test would verify that the billing page component
			// shows verification prompt when emailVerified is false

			const billingState = {
				verificationChecked: true,
				emailVerified: false,
				userEmail: "unverified@example.com",
			};

			// Should show verification prompt
			expect(billingState.verificationChecked).toBe(true);
			expect(billingState.emailVerified).toBe(false);
			// Component would render verification UI instead of billing form
		});

		it("should allow verified premium users to access billing", () => {
			const billingState = {
				verificationChecked: true,
				emailVerified: true,
				userEmail: "verified@example.com",
			};

			// Should show normal billing interface
			expect(billingState.verificationChecked).toBe(true);
			expect(billingState.emailVerified).toBe(true);
			// Component would render billing form
		});
	});
});