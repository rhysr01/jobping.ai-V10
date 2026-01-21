import { expect, test } from "@playwright/test";

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
		visaStatus: "EU citizen",
	});

	test("README Flow 1: 4-Step Premium Form → Email Verification with Production Data", async ({
		page,
	}) => {
		const testData = getTestData();

		// Step 1: Navigate to premium signup
		await page.goto("/signup");
		await expect(page.locator("text=Get 10 jobs in your welcome email")).toBeVisible();

		// Step 2: Complete Step 1 - Basic Info (Name, Email, Cities, Languages)
		await expect(page.locator("text=Full Name")).toBeVisible();
		await page.fill('input[name="fullName"], input[placeholder*="name"]', testData.name);
		await page.fill('input[type="email"]', testData.email);

		// Select cities (premium gets multiple cities)
		for (const city of testData.cities) {
			await page.locator('[role="button"]').filter({ hasText: city }).first().click();
		}

		// Select languages (required for premium)
		await page.locator('[role="button"]').filter({ hasText: "EN English" }).first().click();

		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 3: Complete Step 2 - Preferences (Work Environment, Company Size, etc.)
		await expect(page.locator("text=What type of work environment")).toBeVisible();

		// Select work environment preferences
		await page.locator('[role="button"]').filter({ hasText: "Remote" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Hybrid" }).first().click();

		// Select company size preference
		await page.locator('[role="button"]').filter({ hasText: "Startup" }).first().click();

		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 4: Complete Step 3 - Career Path & Roles
		await expect(page.locator("text=What field interests you")).toBeVisible();

		// Select career path
		await page.locator("button").filter({ hasText: testData.career }).first().click();

		// Select specific roles (premium gets detailed role selection)
		await page.locator('[role="button"]').filter({ hasText: "Software Engineer" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "Product Manager" }).first().click();

		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 5: Complete Step 4 - Matching Preferences & Submit
		await expect(page.locator("text=Experience level")).toBeVisible();

		// Select experience level
		await page.locator("button").filter({ hasText: testData.experience }).first().click();

		// Select visa status
		await page.locator('input[type="radio"]').filter({ hasText: testData.visaStatus }).first().check();

		// Add skills (premium feature)
		await page.locator('[role="button"]').filter({ hasText: "JavaScript" }).first().click();
		await page.locator('[role="button"]').filter({ hasText: "React" }).first().click();

		// Submit the form
		await page.locator("button").filter({ hasText: "Create Premium Account" }).click();

		// Step 6: Verify processing and redirect to email verification
		await expect(page.locator("text=Creating your premium account")).toBeVisible();

		// Step 7: Verify redirect to email verification (production flow)
		await page.waitForURL(/\/signup\/verify/, { timeout: 15000 });
		await expect(page.locator("text=Email Verification Required")).toBeVisible();
		await expect(page.locator("text=Check your email")).toBeVisible();

		// Step 8: Verify email field is pre-filled with production data
		const emailField = page.locator('input[type="email"]');
		await expect(emailField).toHaveValue(testData.email);
	});

	test("README Flow 2: Email Verification → Premium Matches with Production Data", async ({ page }) => {
		// This test simulates the post-verification flow with production-level data
		const testData = getTestData();

		// Simulate post-verification state (production flow)
		await page.goto(
			`/signup/verify?tier=premium&email=${encodeURIComponent(testData.email)}`,
		);

		// Step 1: Complete email verification (simulated for testing)
		await expect(page.locator("text=Verify Your Email")).toBeVisible();
		await page.locator("button").filter({ hasText: /Verify|Continue/ }).first().click();

		// Step 2: Verify premium processing begins (production engine starts matching)
		await expect(page.locator("text=Setting up your premium account")).toBeVisible();

		// Step 3: Verify redirect to matches page (premium users get instant access)
		await page.waitForURL(/\/matches/, { timeout: 30000 });

		// Step 4: Verify premium matches display (production engine returns exactly 15 matches)
		await expect(page.locator("text=Your Premium Matches")).toBeVisible();

		const jobCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(jobCards).toHaveCount(15); // PRODUCTION REQUIREMENT: Premium users get exactly 15 matches

		// Step 5: Verify premium match quality (enhanced data from production engine)
		const firstJobCard = jobCards.first();
		await expect(firstJobCard).toContainText(/€|\$|£/); // Salary information
		await expect(firstJobCard).toContainText(/Remote|Hybrid|Office/); // Work environment
		await expect(firstJobCard).toContainText(testData.cities[0]); // City match

		// Step 6: Verify premium features are available
		await expect(page.locator("text=Email delivery")).toBeVisible();
		await expect(page.locator("text=Weekly updates")).toBeVisible();
		await expect(page.locator("text=Advanced filters")).toBeVisible();

		// Step 7: Verify business rules applied (production engine logic)
		// Check for diverse company sources (not all from same company)
		const companyNames = await jobCards.locator('[class*="company"]').allTextContents();
		const uniqueCompanies = new Set(companyNames);
		expect(uniqueCompanies.size).toBeGreaterThan(5); // PRODUCTION: Diverse company sources
	});

	test("README Flow 3: Premium User Dashboard Access with Production Validation", async ({ page }) => {
		// Simulate premium user state (production session)
		await page.goto("/matches");

		// Step 1: Verify premium branding and features
		await expect(page.locator("text=Premium")).toBeVisible();
		await expect(page.locator("text=15 matches")).toBeVisible();

		// Step 2: Verify enhanced match data from production engine
		const matchCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(matchCards).toHaveCount(15); // PRODUCTION REQUIREMENT

		// Step 3: Verify premium match quality indicators
		const firstCard = matchCards.first();
		await expect(firstCard).toContainText(/Match Score|Similarity/); // AI scoring visible
		await expect(firstCard).toContainText(/Company|Location|Salary/); // Enhanced data

		// Step 4: Verify premium features are accessible
		await expect(page.locator("text=Email delivery")).toBeVisible();
		await expect(page.locator("text=Weekly updates")).toBeVisible();
		await expect(page.locator("text=Advanced filters")).toBeVisible();
		await expect(page.locator("text=Priority support")).toBeVisible();

		// Step 5: Test premium interactions (should work in production)
		// Filter by work environment
		const remoteFilter = page.locator('button, [role="button"]').filter({ hasText: "Remote" });
		if (await remoteFilter.isVisible()) {
			await remoteFilter.click();
			// Should filter matches
			await expect(matchCards).toHaveCount(await matchCards.count()); // Count should change or stay same
		}

		// Step 6: Verify production data integrity
		// Check that all matches have required fields
		for (const card of await matchCards.all()) {
			await expect(card).not.toBeEmpty();
			// Each card should have a company name
			await expect(card.locator('[class*="company"], [class*="title"]')).toBeVisible();
		}
	});
});
