import { expect, test } from "@playwright/test";

/**
 * VISUAL REGRESSION TESTS
 *
 * These tests capture screenshots of critical UI components and compare them
 * against baseline images to detect unintended visual changes.
 *
 * Run with: npm run test:e2e:visual
 * Update baselines: npx playwright test --update-snapshots
 */

test.describe("Visual Regression Tests", () => {
	test.describe("Homepage", () => {
		test("should match homepage visual baseline", async ({ page }) => {
			await page.goto("/");
			await expect(page).toHaveScreenshot("homepage.png", {
				fullPage: true,
				threshold: 0.1, // Allow 10% pixel difference
			});
		});

		test("should match hero section visual baseline", async ({ page }) => {
			await page.goto("/");
			const heroSection = page.locator('[data-testid="hero-section"], .hero, main > section:first-child');
			await expect(heroSection).toHaveScreenshot("hero-section.png", {
				threshold: 0.05, // More strict for hero section
			});
		});
	});

	test.describe("Signup Flow", () => {
		test("should match free signup form visual baseline", async ({ page }) => {
			await page.goto("/signup/free");
			await page.waitForSelector('input[type="email"]', { timeout: 10000 });

			const signupForm = page.locator('form, [data-testid="signup-form"]');
			await expect(signupForm).toHaveScreenshot("free-signup-form.png", {
				threshold: 0.1,
			});
		});

		test("should match premium signup form visual baseline", async ({ page }) => {
			await page.goto("/signup/premium");
			await page.waitForSelector('input[type="email"]', { timeout: 10000 });

			const signupForm = page.locator('form, [data-testid="signup-form"]');
			await expect(signupForm).toHaveScreenshot("premium-signup-form.png", {
				threshold: 0.1,
			});
		});
	});

	test.describe("Matches Display", () => {
		test("should match matches page visual baseline", async ({ page }) => {
			// Navigate to matches page (this would need to be adapted based on your auth flow)
			await page.goto("/matches");

			// Wait for matches to load
			await page.waitForSelector('[data-testid="match-card"], .match-card, [class*="match"]', {
				timeout: 15000,
			});

			const matchesContainer = page.locator('[data-testid="matches-container"], .matches, main');
			await expect(matchesContainer).toHaveScreenshot("matches-display.png", {
				threshold: 0.15, // Allow more tolerance for dynamic content
			});
		});
	});

	test.describe("Navigation & Layout", () => {
		test("should match navigation header visual baseline", async ({ page }) => {
			await page.goto("/");
			const header = page.locator('header, nav, [data-testid="header"]');
			await expect(header).toHaveScreenshot("navigation-header.png", {
				threshold: 0.05,
			});
		});

		test("should match footer visual baseline", async ({ page }) => {
			await page.goto("/");
			const footer = page.locator('footer, [data-testid="footer"]');
			await expect(footer).toHaveScreenshot("footer.png", {
				threshold: 0.05,
			});
		});
	});

	test.describe("Responsive Design", () => {
		test("should match mobile homepage layout", async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
			await page.goto("/");

			await expect(page).toHaveScreenshot("homepage-mobile.png", {
				fullPage: true,
				threshold: 0.1,
			});
		});

		test("should match tablet homepage layout", async ({ page }) => {
			await page.setViewportSize({ width: 768, height: 1024 }); // iPad
			await page.goto("/");

			await expect(page).toHaveScreenshot("homepage-tablet.png", {
				fullPage: true,
				threshold: 0.1,
			});
		});
	});

	test.describe("Interactive Elements", () => {
		test("should match button states", async ({ page }) => {
			await page.goto("/");
			const button = page.locator('[data-testid="cta-button"], .cta-button, button').first();

			// Normal state
			await expect(button).toHaveScreenshot("button-normal.png");

			// Hover state (if supported)
			await button.hover();
			await page.waitForTimeout(100); // Allow hover effect to apply
			await expect(button).toHaveScreenshot("button-hover.png");

			// Focus state
			await button.focus();
			await expect(button).toHaveScreenshot("button-focus.png");
		});

		test("should match form validation states", async ({ page }) => {
			await page.goto("/signup/free");

			// Fill invalid email
			await page.fill('input[type="email"]', 'invalid-email');
			await page.fill('input[placeholder*="name"]', 'Test User');

			// Trigger validation
			await page.click('button[type="submit"]');

			// Wait for validation feedback
			await page.waitForTimeout(1000);

			const form = page.locator('form');
			await expect(form).toHaveScreenshot("form-validation-error.png", {
				threshold: 0.1,
			});
		});
	});

	test.describe("Loading States", () => {
		test("should match loading spinner visual baseline", async ({ page }) => {
			await page.goto("/signup/free");

			// Fill form quickly to trigger loading state
			await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
			await page.fill('input[placeholder*="name"]', 'Test User');

			// Select city to trigger potential loading
			const cityChip = page.locator('[role="button"]').filter({ hasText: /London|Berlin|Paris/ }).first();
			await cityChip.click();

			// Look for loading indicators
			const loadingElement = page.locator('[data-testid*="loading"], .loading, .spinner, [class*="load"]').first();
			if (await loadingElement.isVisible({ timeout: 2000 })) {
				await expect(loadingElement).toHaveScreenshot("loading-spinner.png");
			}
		});
	});

	test.describe("Error States", () => {
		test("should match 404 page visual baseline", async ({ page }) => {
			await page.goto("/non-existent-page");
			await expect(page).toHaveScreenshot("404-page.png", {
				fullPage: true,
				threshold: 0.05,
			});
		});

		test("should match error boundary visual baseline", async ({ page }) => {
			// This would need to be triggered by a specific error condition
			// For now, just test the general error page
			await page.goto("/error-test");
			await expect(page).toHaveScreenshot("error-page.png", {
				fullPage: true,
				threshold: 0.05,
			});
		});
	});
});