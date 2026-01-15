import { test, expect } from "@playwright/test";

/**
 * COMPLETE PREMIUM SIGNUP E2E TEST
 *
 * Validates the README-specified flow:
 * Form → /api/signup → Email Sent → /signup/verify →
 * Email Verified → /billing → Payment → /success
 */

test.describe("Complete Premium Signup Flow", () => {
    const getTestData = () => ({
        email: `premium-e2e-${Date.now()}@jobping-test.com`,
        name: "Premium E2E User",
        cities: ["London", "Berlin"],
        career: "Tech & Engineering",
        experience: "2-3 years",
        visaStatus: "EU citizen"
    });

    test("README Flow 1: 4-Step Premium Form → Email Verification", async ({ page }) => {
        const testData = getTestData();

        // Step 1: Navigate to premium signup
        await page.goto("/signup");
        await expect(page.locator("text=Premium")).toBeVisible();

        // Step 2: Complete Step 1 - Basic Info
        await page.fill('input[type="email"]', testData.email);
        await page.fill('input[placeholder*="name"]', testData.name);
        await page.locator('button').filter({ hasText: /Continue/ }).first().click();

        // Step 3: Complete Step 2 - Career Preferences
        await expect(page.locator("text=What field interests you")).toBeVisible();
        await page.locator('button').filter({ hasText: testData.career }).first().click();
        await page.locator('button').filter({ hasText: /Continue/ }).first().click();

        // Step 4: Complete Step 3 - Location (Premium gets multiple cities)
        await expect(page.locator("text=Which cities interest you")).toBeVisible();
        for (const city of testData.cities) {
            await page.locator('[role="button"]').filter({ hasText: city }).first().click();
        }
        await page.locator('button').filter({ hasText: /Continue/ }).first().click();

        // Step 5: Complete Step 4 - Experience & Visa
        await expect(page.locator("text=Experience level")).toBeVisible();
        await page.locator('button').filter({ hasText: testData.experience }).first().click();

        await page.locator('input[type="radio"]').filter({ hasText: testData.visaStatus }).first().check();
        await page.locator('button').filter({ hasText: /Continue/ }).first().click();

        // Step 6: Verify redirect to email verification (README spec)
        await page.waitForURL(/\/signup\/verify/, { timeout: 10000 });
        await expect(page.locator("text=Email Verification Required")).toBeVisible();
        await expect(page.locator("text=Check your email")).toBeVisible();

        // Step 7: Verify email field is pre-filled
        const emailField = page.locator('input[type="email"]');
        await expect(emailField).toHaveValue(testData.email);
    });

    test("README Flow 2: Email Verification → Payment Flow", async ({ page }) => {
        // Note: This test assumes email verification is bypassed for testing
        // In production, this would require actual email verification

        const testData = getTestData();

        // Simulate post-verification state
        await page.goto(`/signup/verify?email=${encodeURIComponent(testData.email)}`);

        // Step 1: Complete email verification (mock)
        await page.locator('button').filter({ hasText: /Verify|Continue/ }).first().click();

        // Step 2: Verify redirect to billing (README spec)
        await page.waitForURL(/\/billing/, { timeout: 10000 });
        await expect(page.locator("text=Billing")).toBeVisible();
        await expect(page.locator("text=€5")).toBeVisible();

        // Step 3: Complete payment (mock Stripe integration)
        await page.locator('button').filter({ hasText: /Subscribe|Pay/ }).first().click();

        // Step 4: Verify redirect to success (README spec)
        await page.waitForURL(/\/success/, { timeout: 10000 });
        await expect(page.locator("text=Welcome to Premium")).toBeVisible();
        await expect(page.locator("text=Your 15 matches")).toBeVisible();
    });

    test("README Flow 3: Premium User Dashboard Access", async ({ page }) => {
        // Simulate premium user state
        await page.goto("/matches");

        // Should show premium features
        await expect(page.locator("text=Premium")).toBeVisible();
        await expect(page.locator("text=15 matches")).toBeVisible();

        // Should show enhanced match data
        const matchCards = page.locator('[data-testid="job-card"]');
        await expect(matchCards.first()).toBeVisible();

        // Premium features should be accessible
        await expect(page.locator("text=Email delivery")).toBeVisible();
        await expect(page.locator("text=Weekly updates")).toBeVisible();
    });
});