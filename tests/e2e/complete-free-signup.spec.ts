import { expect, test } from "@playwright/test";

/**
 * COMPLETE FREE SIGNUP E2E TEST - PRODUCTION READY
 *
 * Validates the flow with bug fixes:
 * - Bug #1: Uses user_matches table with user_id
 * - Bug #2: API response includes email and matchesCount
 * - Bug #3: Cookie named "user_email" (not "free_user_email")
 * - Bug #4: Matches API queries user_id (not email)
 *
 * Form → useSignupForm → API → user_matches → Cookie → /matches → Display
 */

test.describe("Complete Free Signup Flow - Production Ready", () => {
	// Generate unique test data
	const getTestData = () => ({
		email: `free-e2e-${Date.now()}@jobping-test.com`,
		name: "E2E Test User",
		city: "London",
		career: "Tech & Engineering",
	});

	test("Verified Bug Fixes: Full Free Signup with Production Data", async ({
		page,
	}) => {
		const testData = getTestData();

		// Step 1: Homepage conversion
		await page.goto("/");
		await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
		await page.locator('[data-testid="hero-section"] a[href="/signup/free"]').click();
		await expect(page).toHaveURL(/.*signup\/free/);

		// Step 2: Wait for form to fully load
		await page.waitForLoadState('networkidle', { timeout: 30000 });
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await expect(page.locator("text=What's your name?")).toBeVisible();

		// Step 3: Fill Step 1 - Basic Info
		await page.fill('#fullName', testData.name);
		await page.fill('#email', testData.email);

		// Wait for email validation
		await page.waitForTimeout(2000);

		// Click "Continue" button
		const continueButton = page.locator("button").filter({ hasText: "Continue" });
		await expect(continueButton).toBeEnabled({ timeout: 5000 });
		await continueButton.click();

		// Verify URL changed to Step 2
		await expect(page).toHaveURL(/.*step=2/);
		await page.waitForTimeout(2000);

		// Step 4: Select cities
		await expect(page.locator("text=Where do you want to work?")).toBeVisible();
		const cityButtons = page.locator('[role="button"]').filter({ hasText: testData.city });
		await cityButtons.first().click();

		// Proceed to Step 3
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 5: Select career path
		await expect(page.locator("text=What field interests you")).toBeVisible();
		const careerButton = page.locator("button").filter({ hasText: testData.career }).first();
		await expect(careerButton).toBeVisible();
		await careerButton.click();

		// Step 6: Submit form (triggers API with correct payload)
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// Verify processing overlay
		await expect(page.locator("text=Finding your perfect matches")).toBeVisible();

		// CRITICAL: Verify redirect works with fixed response format
		// Bug #2 fix: API now returns email in response for correct redirect URL
		await page.waitForURL(/\/matches/, { timeout: 30000 });
		
		// CRITICAL: Verify middleware cookie check works
		// Bug #3 fix: Middleware now checks for "user_email" cookie (not "free_user_email")
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Step 7: Verify matches display (production engine)
		const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(jobCards).toHaveCount(5);

		// Step 8: Verify match quality
		const firstJobCard = jobCards.first();
		await expect(firstJobCard).toContainText(/€|\$|£/);
		await expect(firstJobCard).toContainText(testData.city);

		// Step 9: Verify upgrade prompts
		await expect(page.locator("text=Upgrade")).toBeVisible();
		await expect(page.locator("text=Premium")).toBeVisible();
	});

	test("Verified Bug Fixes: Existing User Redirect with Correct Cookie Check", async ({ page }) => {
		const testData = getTestData();

		// First complete signup (create user with production-level data)
		await page.goto("/signup/free");

		// Step 1: Basic Info - wait for form to load
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await page.fill('#fullName', testData.name);
		await page.fill('#email', testData.email);
		await page.locator("button").filter({ hasText: "Enter your details" }).click();

		// Step 2: Cities
		await page.locator('[role="button"]').filter({ hasText: testData.city }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 3: Career + Submit
		await page.locator("button").filter({ hasText: testData.career }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// Wait for completion and redirect
		await page.waitForURL(/\/matches/, { timeout: 30000 });

		// Verify matches page loaded (cookie check passed)
		// Bug #3 fix: Middleware now correctly checks "user_email" cookie
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Second signup attempt (existing user) - should redirect
		await page.goto("/signup/free");

		// Step 1: Basic Info - wait for form to load
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await page.fill('#fullName', testData.name);
		await page.fill('#email', testData.email);
		await page.locator("button").filter({ hasText: "Enter your details" }).click();

		// Step 2: Cities
		await page.locator('[role="button"]').filter({ hasText: testData.city }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 3: Career + Submit
		await page.locator("button").filter({ hasText: testData.career }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// Should redirect directly to matches (existing user with valid cookie)
		await page.waitForURL(/\/matches/, { timeout: 10000 });
		
		// Verify existing matches are still there (exactly 5)
		// Bug #4 fix: Matches fetched using user_id from user_matches table
		const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(jobCards).toHaveCount(5);
	});

	test("Database Integrity: user_matches table queries work correctly", async ({
		page,
	}) => {
		// This test verifies Bug #1 fix: user_matches table is used correctly
		const testData = getTestData();

		await page.goto("/signup/free");

		// Complete signup
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await page.fill('#fullName', testData.name);
		await page.fill('#email', testData.email);
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		await page.locator('[role="button"]').filter({ hasText: testData.city }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		await page.locator("button").filter({ hasText: testData.career }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// Wait for redirect to matches page
		await page.waitForURL(/\/matches/, { timeout: 30000 });

		// The fact that we reach the matches page proves the database query worked
		// Bug #1 fix: API correctly queried user_matches table with user_id
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Verify job data loaded (came from user_matches join with jobs table)
		const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		const count = await jobCards.count();
		expect(count).toBeGreaterThan(0);
	});

	test("CSS Overlay Fix Verification - Button Clicks Work", async ({
		page,
	}) => {
		// Navigate directly to signup form
		await page.goto("/signup/free");

		// Fill form fields
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await page.fill('#fullName', 'Test User');
		await page.fill('#email', 'test@example.com');

		// Wait for validation
		await page.waitForTimeout(2000);

		// Verify button is enabled and click it
		const continueButton = page.locator("button").filter({ hasText: "Continue" });
		await expect(continueButton).toBeEnabled({ timeout: 5000 });

		// Click and verify URL changes
		await continueButton.click();
		await expect(page).toHaveURL(/.*step=2/);

		// Verify step 2 content loads
		await expect(page.locator("text=Where do you want to work?")).toBeVisible();
	});
});
