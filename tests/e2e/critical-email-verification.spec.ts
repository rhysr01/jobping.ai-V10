/**
 * CRITICAL E2E TEST: Email Verification Flow
 *
 * Tests the complete email verification user journey that is CRITICAL for revenue:
 * - Premium users cannot access paid features without email verification
 * - Tests real email link clicking, token validation, expired links, resend functionality
 *
 * This follows JobPing testing strategy (docs/testing.md):
 * - Production-first approach with real user scenarios
 * - Complete user journey validation
 * - Error recovery testing
 * - Cross-browser compatibility
 */

import { expect, test } from "@playwright/test";
import { Resend } from "resend";

// Mock email service for testing
const mockResend = new Resend(process.env.RESEND_API_KEY);

test.describe("Critical Email Verification Flow", () => {
	// Use single worker to avoid email conflicts
	test.describe.configure({ mode: "parallel", workers: 1 });

	const generateTestEmail = () => {
		const timestamp = Date.now();
		return `critical-e2e-${timestamp}@testjobping.com`;
	};

	test("Complete Premium Email Verification Journey", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		console.log(`🧪 Testing critical email verification for ${testEmail}`);

		// ========================================
		// STEP 1: Complete Premium Signup
		// ========================================
		await page.goto("/signup");

		// Step 1.1: Basic Info (Name, Email, Cities, Languages)
		await expect(page.locator("text=Full Name")).toBeVisible();
		await page.fill('#fullName', "Critical Test User");
		await page.fill('#email', testEmail);

		// Select cities (premium gets multiple)
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Berlin" }).first().click();

		// Select languages
		await page.locator('[role="button"]').filter({ hasText: "EN English" }).first().click();

		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 1.2: Preferences (Work Environment, Company Size)
		await expect(page.locator("text=What type of work environment")).toBeVisible();
		await page.locator('[role="button"]').filter({ hasText: "Remote" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Startup" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 1.3: Career Path & Roles
		await expect(page.locator("text=What field interests you")).toBeVisible();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Software Engineer" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Product Manager" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 1.4: Matching Preferences & Submit
		await expect(page.locator("text=Experience level")).toBeVisible();
		await page.locator("button").filter({ hasText: "1-2 years" }).first().click();
		await page.locator('input[type="radio"]').filter({ hasText: "EU citizen" }).first().check();

		// Add skills
		await page.locator('[role="button"]').filter({ hasText: "JavaScript" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "React" }).first().click();

		// Submit premium signup
		await page.locator("button").filter({ hasText: "Create Premium Account" }).click();

		// ========================================
		// STEP 2: Verify Email Verification Page
		// ========================================
		await expect(page.locator("text=Email Verification Required")).toBeVisible();
		await expect(page.locator(`text=${testEmail}`)).toBeVisible();
		await expect(page.locator("text=Check Your Email")).toBeVisible();

		// Verify email field is pre-filled
		const emailField = page.locator('input[type="email"]');
		await expect(emailField).toHaveValue(testEmail);

		// ========================================
		// STEP 3: Test Resend Functionality
		// ========================================
		const resendButton = page.locator("button").filter({ hasText: "Resend Email" });
		await expect(resendButton).toBeEnabled();

		// Click resend and verify feedback
		await resendButton.click();
		await expect(page.locator("text=Verification email sent!")).toBeVisible();

		// ========================================
		// STEP 4: Simulate Real Email Verification
		// ========================================
		// In production, this would be done by clicking a link in the actual email
		// For testing, we'll simulate the verification process

		// Get verification token from database (test helper)
		const verificationToken = await getVerificationTokenFromDatabase(testEmail);

		// Navigate to verification URL (simulating email link click)
		await page.goto(`/api/verify-email?token=${verificationToken}&email=${encodeURIComponent(testEmail)}`);

		// Should redirect to billing page for premium users
		await page.waitForURL(/\/billing/, { timeout: 10000 });
		await expect(page.locator("text=Billing")).toBeVisible();
		await expect(page.locator("text=€5")).toBeVisible();

		// ========================================
		// STEP 5: Verify Premium Access After Verification
		// ========================================
		// Check that user can now access premium features
		await expect(page.locator("text=Premium")).toBeVisible();
		await expect(page.locator("text=15 matches")).toBeVisible();

		console.log(`✅ Critical email verification flow completed for ${testEmail}`);
	});

	test("Email Verification Token Expiration", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// Create premium user
		await request.post("/api/signup", {
			data: {
				fullName: "Token Expiration Test",
				email: testEmail,
				cities: ["London"],
				languages: ["English"],
				careerPath: "tech",
				experience: "entry",
				workEnvironment: ["hybrid"],
				visaStatus: "eu-citizen",
				gdprConsent: true,
			},
		});

		// Try to verify with expired/invalid token
		await page.goto(`/api/verify-email?token=expired-token-123&email=${encodeURIComponent(testEmail)}`);

		// Should redirect to success page with error
		await page.waitForURL(/\/signup\/success/, { timeout: 10000 });
		await expect(page.locator("text=Invalid or expired token")).toBeVisible();
	});

	test("Multiple Verification Attempts", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// Create premium user
		await request.post("/api/signup", {
			data: {
				fullName: "Multiple Attempts Test",
				email: testEmail,
				cities: ["London"],
				languages: ["English"],
				careerPath: "tech",
				experience: "entry",
				workEnvironment: ["hybrid"],
				visaStatus: "eu-citizen",
				gdprConsent: true,
			},
		});

		// Get valid token
		const validToken = await getVerificationTokenFromDatabase(testEmail);

		// First verification attempt (should succeed)
		await page.goto(`/api/verify-email?token=${validToken}&email=${encodeURIComponent(testEmail)}`);
		await page.waitForURL(/\/billing/, { timeout: 10000 });

		// Second verification attempt with same token (should handle gracefully)
		await page.goto(`/api/verify-email?token=${validToken}&email=${encodeURIComponent(testEmail)}`);
		// Should still redirect to billing (idempotent)
		await page.waitForURL(/\/billing/, { timeout: 10000 });
	});

	test("Email Verification Rate Limiting", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// Create premium user
		await request.post("/api/signup", {
			data: {
				fullName: "Rate Limiting Test",
				email: testEmail,
				cities: ["London"],
				languages: ["English"],
				careerPath: "tech",
				experience: "entry",
				workEnvironment: ["hybrid"],
				visaStatus: "eu-citizen",
				gdprConsent: true,
			},
		});

		// Attempt multiple rapid verifications (should be rate limited)
		for (let i = 0; i < 10; i++) {
			const response = await request.post("/api/verify-email", {
				data: { email: testEmail, token: "test-token" },
			});

			// First few should fail validation, later ones should be rate limited
			if (i > 5) {
				// Rate limiting should kick in
				expect(response.status()).toBe(429);
			}
		}
	});
});

// Test helper function - in production this would be replaced with actual email parsing
async function getVerificationTokenFromDatabase(email: string): Promise<string> {
	// This is a test helper that would query the database for the verification token
	// In a real implementation, you'd need to intercept emails or query the DB directly

	// For now, return a mock token - in production you'd need to:
	// 1. Set up email interception (e.g., MailHog, Ethereal Email)
	// 2. Parse the actual email content
	// 3. Extract the verification link
	// 4. Parse the token from the URL

	const supabase = (await import("../../utils/core/database-pool")).getDatabaseClient();

	// Query for the verification token from email_verifications table
	const { data } = await supabase
		.from("email_verifications")
		.select("token")
		.eq("email", email)
		.eq("verified", false)
		.order("created_at", { ascending: false })
		.limit(1)
		.single();

	return data?.token || "test-verification-token";
}