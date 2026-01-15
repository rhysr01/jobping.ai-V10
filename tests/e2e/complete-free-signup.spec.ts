import { test, expect } from "@playwright/test";

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
        career: "Tech & Engineering"
    });

    test("README Flow 1: Homepage → Signup Form with Live Previews", async ({ page }) => {
        const testData = getTestData();

        // Step 1: Homepage conversion
        await page.goto("/");
        await expect(page.locator("text=Find my matches")).toBeVisible();
        await page.locator("text=Find my matches").first().click();
        await expect(page).toHaveURL(/.*signup\/free/);

        // Step 2: Form loads with real-time features
        await expect(page.locator("text=Quick Signup - 60 Seconds")).toBeVisible();
        await expect(page.locator("text=See 5 Perfect Matches Instantly")).toBeVisible();

        // Step 3: Fill form and trigger live matching
        await page.fill('input[type="email"]', testData.email);
        await page.fill('input[placeholder*="name"]', testData.name);

        // Select city (triggers live matching)
        const cityChip = page.locator('[role="button"]').filter({ hasText: testData.city }).first();
        await expect(cityChip).toBeVisible();
        await cityChip.click();

        // Verify LiveMatchingOverlay appears
        await expect(page.locator("text=Live Job Matching")).toBeVisible();
        await expect(page.locator("text=Scanning")).toBeVisible();

        // Step 4: Select career path (triggers job previews)
        const careerButton = page.locator('button').filter({ hasText: testData.career }).first();
        await expect(careerButton).toBeVisible();
        await careerButton.click();

        // Verify LiveJobsReview appears with actual job previews
        await expect(page.locator("text=jobs found")).toBeVisible();

        // Step 5: Complete GDPR compliance
        const ageCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /16/ });
        await ageCheckbox.check();

        const termsCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /terms/ });
        await termsCheckbox.check();

        // Step 6: Submit and verify redirect
        const submitButton = page.locator('button').filter({ hasText: /Show Me My 5 Matches/ });
        await submitButton.click();

        // Step 7: Verify LiveMatchingOverlay shows processing
        await expect(page.locator("text=Creating Account")).toBeVisible();

        // Step 8: Verify redirect to matches page
        await page.waitForURL(/\/matches/, { timeout: 30000 });
        await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

        // Step 9: Verify matches display
        const jobCards = page.locator('[data-testid="job-card"], .job-card');
        await expect(jobCards.first()).toBeVisible();

        // Step 10: Verify upgrade prompts (business goal)
        await expect(page.locator("text=Upgrade")).toBeVisible();
        await expect(page.locator("text=Premium")).toBeVisible();
    });

    test("README Flow 2: Existing User Redirect", async ({ page }) => {
        const testData = getTestData();

        // First signup (create user)
        await page.goto("/signup/free");
        await page.fill('input[type="email"]', testData.email);
        await page.fill('input[placeholder*="name"]', testData.name);
        await page.locator('[role="button"]').filter({ hasText: testData.city }).first().click();
        await page.locator('button').filter({ hasText: testData.career }).first().click();

        // GDPR compliance
        await page.locator('input[type="checkbox"]').filter({ hasText: /16/ }).check();
        await page.locator('input[type="checkbox"]').filter({ hasText: /terms/ }).check();

        await page.locator('button').filter({ hasText: /Show Me My 5 Matches/ }).click();
        await page.waitForURL(/\/matches/);

        // Second signup attempt (existing user)
        await page.goto("/signup/free");
        await page.fill('input[type="email"]', testData.email);
        await page.fill('input[placeholder*="name"]', testData.name);
        await page.locator('[role="button"]').filter({ hasText: testData.city }).first().click();
        await page.locator('button').filter({ hasText: testData.career }).first().click();

        // GDPR compliance
        await page.locator('input[type="checkbox"]').filter({ hasText: /16/ }).check();
        await page.locator('input[type="checkbox"]').filter({ hasText: /terms/ }).check();

        await page.locator('button').filter({ hasText: /Show Me My 5 Matches/ }).click();

        // Should redirect directly to matches (README spec)
        await page.waitForURL(/\/matches/, { timeout: 10000 });
        await expect(page.locator("text=Looks like you already have a JobPing account")).toBeVisible();
    });
});