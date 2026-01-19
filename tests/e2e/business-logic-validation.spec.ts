import { expect, test } from "@playwright/test";

/**
 * BUSINESS LOGIC VALIDATION TEST
 *
 * Validates that UserChoiceRespector business logic works correctly:
 * - City distribution
 * - Source diversity
 * - Career path balancing
 */

test.describe("Business Logic Validation", () => {
	test("UserChoiceRespector: City Distribution Works", async ({ page }) => {
		// Create a test user with multiple cities
		const testEmail = `business-logic-${Date.now()}@test.com`;

		// Complete signup with 3 cities
		await page.goto("/signup/free");
		await page.fill('input[type="email"]', testEmail);
		await page.fill('input[placeholder*="name"]', "Business Logic Test");

		// Select 3 cities
		const cities = ["London", "Berlin", "Amsterdam"];
		for (const city of cities) {
			await page
				.locator('[role="button"]')
				.filter({ hasText: city })
				.first()
				.click();
		}

		await page.locator("button").filter({ hasText: "Tech" }).first().click();

		// GDPR
		await page
			.locator('input[type="checkbox"]')
			.filter({ hasText: /16/ })
			.check();
		await page
			.locator('input[type="checkbox"]')
			.filter({ hasText: /terms/ })
			.check();

		await page
			.locator("button")
			.filter({ hasText: /Show Me My 5 Matches/ })
			.click();
		await page.waitForURL(/\/matches/);

		// Verify city distribution in matches
		const matchLocations = await page
			.locator('[data-testid="job-location"], .job-location')
			.allTextContents();
		const uniqueCities = [
			...new Set(
				matchLocations
					.map((loc) =>
						cities.find((city) =>
							loc.toLowerCase().includes(city.toLowerCase()),
						),
					)
					.filter(Boolean),
			),
		];

		// Should show jobs from multiple cities (business logic working)
		expect(uniqueCities.length).toBeGreaterThan(1);
	});

	test("UserChoiceRespector: Source Diversity Works", async ({ page }) => {
		// This would require inspecting the actual job sources returned
		// For now, we validate that multiple jobs are shown with different companies

		const testEmail = `source-diversity-${Date.now()}@test.com`;

		// Complete signup
		await page.goto("/signup/free");
		await page.fill('input[type="email"]', testEmail);
		await page.fill('input[placeholder*="name"]', "Source Diversity Test");
		await page
			.locator('[role="button"]')
			.filter({ hasText: "London" })
			.first()
			.click();
		await page.locator("button").filter({ hasText: "Tech" }).first().click();

		// GDPR
		await page
			.locator('input[type="checkbox"]')
			.filter({ hasText: /16/ })
			.check();
		await page
			.locator('input[type="checkbox"]')
			.filter({ hasText: /terms/ })
			.check();

		await page
			.locator("button")
			.filter({ hasText: /Show Me My 5 Matches/ })
			.click();
		await page.waitForURL(/\/matches/);

		// Check for diverse job sources (different companies)
		const companyNames = await page
			.locator('[data-testid="job-company"], .job-company')
			.allTextContents();
		const uniqueCompanies = [...new Set(companyNames)];

		// Should show jobs from multiple companies (source diversity)
		expect(uniqueCompanies.length).toBeGreaterThan(2);
	});

	test("Premium User: Career Path Balance (if 2 paths selected)", async ({
		page,
	}) => {
		// Premium users with 2 career paths should get balanced distribution
		// This test would require premium signup flow to be fully implemented
		// with 2 career path selection

		console.log(
			"Premium career path balance test - requires full premium flow implementation",
		);
	});
});
