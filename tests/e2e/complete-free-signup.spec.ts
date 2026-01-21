import { expect, test } from "@playwright/test";

/**
 * COMPLETE FREE SIGNUP E2E TEST
 *
 * Validates the README-specified flow:
 * Form → useSignupForm → LiveMatchingOverlay → LiveJobsReview →
 * signupService → /api/signup/free → DB → Cookie → /matches → Display
 */

test.describe("Complete Free Signup Flow", () => {
	// Generate unique test data
	const getTestData = () => ({
		email: `free-e2e-${Date.now()}@jobping-test.com`,
		name: "E2E Test User",
		city: "London",
		career: "Tech & Engineering",
	});

	test("README Flow 1: Homepage → Multi-Step Free Signup → Matches", async ({
		page,
	}) => {
		const testData = getTestData();

		// Step 1: Homepage conversion
		await page.goto("/");
		// Target the hero section CTA specifically to avoid multiple element matches
		await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
		await page.locator('[data-testid="hero-section"] a[href="/signup/free"]').click();
		await expect(page).toHaveURL(/.*signup\/free/);

		// Step 2: Wait for form to fully load (page loads asynchronously)
		await page.waitForLoadState('networkidle', { timeout: 30000 });
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await expect(page.locator("text=What's your name?")).toBeVisible();
		await expect(page.locator('label:has-text("Enter your email")')).toBeVisible();

		// Step 3: Fill Step 1 - Basic Info
		await page.fill('#fullName', testData.name);
		await page.fill('#email', testData.email);

		// Wait for email validation
		await page.waitForTimeout(2000);

		// Click "Continue" button to proceed to Step 2
		const continueButton = page.locator("button").filter({ hasText: "Continue" });
		await expect(continueButton).toBeEnabled({ timeout: 5000 });

		// Verify button click triggers step transition
		const urlBefore = page.url();
		await continueButton.click();

		// Verify URL changed to include step parameter
		await expect(page).toHaveURL(/.*step=2/);

		// Wait for content to update
		await page.waitForTimeout(2000);

		// Step 4: Verify Step 2 loads (City Selection)
		await expect(page.locator("text=Where do you want to work?")).toBeVisible();

		// Step 5: Select cities (multiple cities supported)
		const cityButtons = page.locator('[role="button"]').filter({ hasText: testData.city });
		await cityButtons.first().click();

		// Click Continue to proceed to Step 3
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 6: Verify Step 3 loads (Career Path)
		await expect(page.locator("text=What field interests you")).toBeVisible();

		// Step 7: Select career path
		const careerButton = page.locator("button").filter({ hasText: testData.career }).first();
		await expect(careerButton).toBeVisible();
		await careerButton.click();

		// Step 8: Complete GDPR compliance (age verification and terms)
		// Note: Age verification is handled in the component, terms acceptance is in the form data

		// Step 9: Submit form (this triggers the API call and redirects)
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// Step 10: Verify processing overlay appears
		await expect(page.locator("text=Finding your perfect matches")).toBeVisible();

		// Step 11: Verify redirect to matches page with production-level data
		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Step 12: Verify matches display (production engine returns exactly 5 matches)
		const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(jobCards).toHaveCount(5); // PRODUCTION REQUIREMENT: Free users get exactly 5 matches

		// Step 13: Verify match quality (production engine provides real job data)
		const firstJobCard = jobCards.first();
		await expect(firstJobCard).toContainText(/€|\$|£/); // Should show salary info
		await expect(firstJobCard).toContainText(testData.city); // Should match selected city

		// Step 14: Verify upgrade prompts (business requirement)
		await expect(page.locator("text=Upgrade")).toBeVisible();
		await expect(page.locator("text=Premium")).toBeVisible();
	});

	test("README Flow 2: Existing User Redirect with Production Data", async ({ page }) => {
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

		// Second signup attempt (existing user) - should redirect directly
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

		// Should redirect directly to matches (production behavior)
		await page.waitForURL(/\/matches/, { timeout: 10000 });
		await expect(
			page.locator("text=Looks like you already have a JobPing account"),
		).toBeVisible();

		// Verify existing matches are still there (exactly 5)
		const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(jobCards).toHaveCount(5); // PRODUCTION REQUIREMENT: Free users get exactly 5 matches
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
