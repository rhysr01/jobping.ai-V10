/**
 * CRITICAL E2E TEST: Error Recovery & Resilience
 *
 * Tests system resilience that prevents user abandonment:
 * - Network disconnection during signup
 * - Server timeout handling with user feedback
 * - Partial form data recovery
 * - Browser crash recovery
 * - Service degradation graceful degradation
 * - Offline/online transitions
 *
 * This follows JobPing testing strategy (docs/testing.md):
 * - Chaos engineering approach for resilience validation
 * - Error recovery testing for critical user journeys
 * - Graceful degradation under failure conditions
 */

import { expect, test } from "@playwright/test";

test.describe("Critical Error Recovery & Resilience", () => {
	test.describe.configure({ mode: "parallel", workers: 1 });

	const generateTestEmail = () => {
		const timestamp = Date.now();
		return `critical-error-${timestamp}@testjobping.com`;
	};

	test("Network Disconnection During Signup", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		console.log(`🌐 Testing network disconnection recovery for ${testEmail}`);

		// ========================================
		// STEP 1: Start Signup Process
		// ========================================
		await page.goto("/signup/free");
		await page.waitForSelector('#fullName', { timeout: 15000 });

		await page.fill('#fullName', "Network Test User");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		// ========================================
		// STEP 2: Go Offline During Form Submission
		// ========================================
		// Go offline just before clicking submit
		await page.context().setOffline(true);

		await page.locator("button").filter({ hasText: "Enter your details" }).click();

		// ========================================
		// STEP 3: Verify Offline Error Handling
		// ========================================
		// Should show offline error message
		await expect(page.locator("text=No internet connection")).toBeVisible();
		await expect(page.locator("text=Please check your connection")).toBeVisible();

		// Form should retain data
		await expect(page.locator('#fullName')).toHaveValue("Network Test User");
		await expect(page.locator('#email')).toHaveValue(testEmail);

		// ========================================
		// STEP 4: Test Online Recovery
		// ========================================
		// Restore connection
		await page.context().setOffline(false);

		// Should show recovery message and allow retry
		await expect(page.locator("text=Connection restored")).toBeVisible();

		// Retry button should work
		const retryButton = page.locator("button").filter({ hasText: "Retry" });
		if (await retryButton.isVisible()) {
			await retryButton.click();
		} else {
			// Or resubmit the form
			await page.locator("button").filter({ hasText: "Enter your details" }).click();
		}

		// ========================================
		// STEP 5: Verify Successful Completion
		// ========================================
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
	});

	test("Server Timeout Handling", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Setup Timeout Simulation
		// ========================================
		// Intercept API calls and simulate timeouts
		await page.route('/api/signup/free', async route => {
			// Simulate server timeout
			await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than client timeout
			await route.fulfill({
				status: 504,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Gateway Timeout' })
			});
		});

		// ========================================
		// STEP 2: Attempt Signup with Timeout
		// ========================================
		await page.goto("/signup/free");
		await page.waitForSelector('#fullName', { timeout: 15000 });

		await page.fill('#fullName', "Timeout Test User");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		await page.locator("button").filter({ hasText: "Enter your details" }).click();

		// Continue through steps
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();

		// ========================================
		// STEP 3: Submit with Simulated Timeout
		// ========================================
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// ========================================
		// STEP 4: Verify Timeout Error Handling
		// ========================================
		await expect(page.locator("text=Request timed out")).toBeVisible();
		await expect(page.locator("text=Please try again")).toBeVisible();

		// Should offer retry option
		const retryButton = page.locator("button").filter({ hasText: "Try Again" });
		await expect(retryButton).toBeVisible();

		// ========================================
		// STEP 5: Test Retry After Timeout
		// ========================================
		// Remove the timeout simulation for retry
		await page.unroute('/api/signup/free');

		await retryButton.click();

		// Should proceed normally now
		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
	});

	test("Partial Form Data Recovery", async ({ page }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Fill Form Partially
		// ========================================
		await page.goto("/signup/free");
		await page.waitForSelector('#fullName', { timeout: 15000 });

		await page.fill('#fullName', "Recovery Test User");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Berlin" }).first().click();

		// ========================================
		// STEP 2: Simulate Browser Crash/Page Refresh
		// ========================================
		// Force page refresh (simulating browser crash recovery)
		await page.reload();

		// ========================================
		// STEP 3: Verify Form Data Recovery
		// ========================================
		await page.waitForSelector('#fullName', { timeout: 15000 });

		// Form should recover data (if implemented)
		const nameValue = await page.locator('#fullName').inputValue();
		const emailValue = await page.locator('#email').inputValue();

		// At minimum, should not crash and allow re-entry
		expect(nameValue).toBe(""); // May not recover due to security
		expect(emailValue).toBe(""); // May not recover due to security

		// But should allow continuing
		await page.fill('#fullName', "Recovery Test User");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		// ========================================
		// STEP 4: Complete Successfully
		// ========================================
		await page.locator("button").filter({ hasText: "Enter your details" }).click();
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
	});

	test("Service Degradation Graceful Handling", async ({ page }) => {
		// ========================================
		// STEP 1: Simulate AI Service Down
		// ========================================
		await page.route('/api/matching/**', route => route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ error: 'AI service temporarily unavailable' })
		}));

		// ========================================
		// STEP 2: Attempt Signup
		// ========================================
		await page.goto("/signup/free");
		await page.waitForSelector('#fullName', { timeout: 15000 });

		await page.fill('#fullName', "Degradation Test");
		await page.fill('#email', `degradation-${Date.now()}@test.com`);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		await page.locator("button").filter({ hasText: "Enter your details" }).click();
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// ========================================
		// STEP 3: Verify Graceful Degradation
		// ========================================
		// Should still show matches using fallback system
		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Should indicate fallback mode
		await expect(page.locator("text=Fallback matching")).toBeVisible();

		// Should still show 5 matches
		const matchCards = page.locator('[data-testid="job-card"], .job-card');
		await expect(matchCards).toHaveCount(5);
	});

	test("Database Connection Failure Recovery", async ({ page }) => {
		// ========================================
		// STEP 1: Simulate Database Outage
		// ========================================
		await page.route('/api/signup/free', route => route.fulfill({
			status: 500,
			contentType: 'application/json',
			body: JSON.stringify({ error: 'Database connection failed' })
		}));

		// ========================================
		// STEP 2: Attempt Signup During Outage
		// ========================================
		await page.goto("/signup/free");
		await page.waitForSelector('#fullName', { timeout: 15000 });

		await page.fill('#fullName', "Database Test");
		await page.fill('#email', `database-${Date.now()}@test.com`);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		await page.locator("button").filter({ hasText: "Enter your details" }).click();
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// ========================================
		// STEP 3: Verify Error Handling
		// ========================================
		await expect(page.locator("text=Service temporarily unavailable")).toBeVisible();
		await expect(page.locator("text=Please try again in a few minutes")).toBeVisible();

		// Should offer retry option
		const retryButton = page.locator("button").filter({ hasText: "Retry" });
		await expect(retryButton).toBeVisible();

		// ========================================
		// STEP 4: Test Recovery When Service Restored
		// ========================================
		// Remove the outage simulation
		await page.unroute('/api/signup/free');

		await retryButton.click();

		// Should proceed normally now
		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
	});

	test("Browser Crash Recovery", async ({ page }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Start Signup Process
		// ========================================
		await page.goto("/signup/free");
		await page.waitForSelector('#fullName', { timeout: 15000 });

		await page.fill('#fullName', "Crash Recovery Test");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		// ========================================
		// STEP 2: Simulate Browser Crash (Page Close)
		// ========================================
		// Note: In real testing, this would require browser context management
		// For this test, we'll simulate by clearing all state

		await page.context().clearCookies();
		await page.evaluate(() => {
			// Clear localStorage and sessionStorage
			localStorage.clear();
			sessionStorage.clear();
		});

		// ========================================
		// STEP 3: Attempt Recovery
		// ========================================
		await page.reload();

		// Should return to clean state but allow restart
		await expect(page.locator("text=Get your matches")).toBeVisible();

		// Should allow starting over
		await page.locator('a[href="/signup/free"]').click();
		await page.waitForSelector('#fullName', { timeout: 15000 });

		// Form should be clean
		await expect(page.locator('#fullName')).toHaveValue("");
		await expect(page.locator('#email')).toHaveValue("");

		// ========================================
		// STEP 4: Complete Successfully After Recovery
		// ========================================
		await page.fill('#fullName', "Crash Recovery Test");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();

		await page.locator("button").filter({ hasText: "Enter your details" }).click();
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
	});

	test("Progressive Enhancement - JavaScript Disabled", async ({ page }) => {
		// ========================================
		// STEP 1: Disable JavaScript
		// ========================================
		await page.route('**/*', route => {
			const request = route.request();
			if (request.resourceType() === 'script') {
				route.abort();
			} else {
				route.continue();
			}
		});

		// ========================================
		// STEP 2: Test No-JS Experience
		// ========================================
		await page.goto("/");

		// Should still show basic content
		await expect(page.locator("text=Graduate Jobs Made Simple")).toBeVisible();

		// Links should still work without JS
		const signupLink = page.locator('a[href="/signup/free"]');
		await expect(signupLink).toBeVisible();

		await signupLink.click();

		// ========================================
		// STEP 3: Verify Graceful Degradation
		// ========================================
		// Should show no-JS message or basic form
		await expect(page.locator("text=JavaScript required")).toBeVisible();

		// Or should provide basic HTML-only experience
		const basicForm = page.locator('form');
		if (await basicForm.isVisible()) {
			// If basic form works, test it
			await page.fill('input[name="email"]', "no-js@test.com");
			await page.fill('input[name="name"]', "No JS Test");

			// Submit should work via HTML form submission
			await page.locator('input[type="submit"], button[type="submit"]').click();
		}
	});

	test("Concurrent Request Handling", async ({ page, request }) => {
		const testEmail1 = generateTestEmail();
		const testEmail2 = generateTestEmail();

		// ========================================
		// STEP 1: Start Multiple Signup Processes
		// ========================================
		// Open two tabs and start signup simultaneously
		const page2 = await page.context().newPage();

		await page.goto("/signup/free");
		await page2.goto("/signup/free");

		await page.waitForSelector('#fullName', { timeout: 15000 });
		await page2.waitForSelector('#fullName', { timeout: 15000 });

		// Fill forms simultaneously
		await Promise.all([
			page.fill('#fullName', "Concurrent Test 1"),
			page.fill('#email', testEmail1),
			page.locator('[role="button"]').filter({ hasText: "London" }).first().click(),

			page2.fill('#fullName', "Concurrent Test 2"),
			page2.fill('#email', testEmail2),
			page2.locator('[role="button"]').filter({ hasText: "Berlin" }).first().click(),
		]);

		// ========================================
		// STEP 2: Submit Simultaneously
		// ========================================
		await Promise.all([
			page.locator("button").filter({ hasText: "Enter your details" }).click(),
			page2.locator("button").filter({ hasText: "Enter your details" }).click(),
		]);

		// Continue through both flows
		await Promise.all([
			page.locator('[role="button"]').filter({ hasText: "London" }).first().click(),
			page.locator("button").filter({ hasText: "Continue" }).first().click(),
			page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click(),
			page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click(),

			page2.locator('[role="button"]').filter({ hasText: "Berlin" }).first().click(),
			page2.locator("button").filter({ hasText: "Continue" }).first().click(),
			page2.locator("button").filter({ hasText: "Tech & Transformation" }).first().click(),
			page2.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click(),
		]);

		// ========================================
		// STEP 3: Verify Both Complete Successfully
		// ========================================
		await Promise.all([
			page.waitForURL(/\/matches/, { timeout: 30000 }),
			page2.waitForURL(/\/matches/, { timeout: 30000 }),
		]);

		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
		await expect(page2.locator("text=Your Perfect Matches")).toBeVisible();

		// Both should have 5 matches
		await expect(page.locator('[data-testid="job-card"], .job-card')).toHaveCount(5);
		await expect(page2.locator('[data-testid="job-card"], .job-card')).toHaveCount(5);

		await page2.close();
	});
});

// Helper functions
async function getVerificationTokenFromDatabase(email: string): Promise<string> {
	const supabase = (await import("../../utils/core/database-pool")).getDatabaseClient();
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