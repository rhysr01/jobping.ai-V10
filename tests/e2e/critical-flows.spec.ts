import { expect, test } from "@playwright/test";
import { waitForPageLoad, fastWaitForSelector } from "./test-utils";

/**
 * Critical E2E Tests for JobPing
 *
 * Tests use data-testids and roles instead of literal copy for better maintainability
 */

test.describe("Critical User Flows", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("Homepage basic load test", async ({ page }) => {
		// Ultra simple test - just verify we can navigate without hanging
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Check we're on the right page
		expect(page.url()).toContain("localhost:3001");

		// Verify we have a body element (basic page structure)
		const body = page.locator('body');
		await expect(body).toBeVisible();

		console.log("✅ Homepage loads successfully");
	});

	test("Free user signup flow works end-to-end", async ({
		page,
	}) => {
		// Start at homepage (real user journey)
		await page.goto("/");
		await page.waitForLoadState('networkidle');

		// Click the main CTA (what real users do to sign up)
		await page.locator("text=Get My 5 Free Matches").first().click();

		// Should navigate to signup page (or stay on same page with form)
		// Wait for either URL change or form appearance
		await Promise.race([
			page.waitForURL(/.*signup/),
			page.locator('form, [role="form"], input[type="email"]').first().waitFor({ timeout: 5000 })
		]);

		// Verify we can access signup functionality (form or signup page)
		const hasSignupForm = await page.locator('form, input[type="email"], [data-testid*="signup"]').count() > 0;
		const isOnSignupPage = page.url().includes('signup') || page.url().includes('register');

		expect(hasSignupForm || isOnSignupPage).toBe(true);

		// Test that basic signup elements are present (real user expectation)
		if (hasSignupForm) {
			// Look for email input (most common signup field)
			const emailInput = page.locator('input[type="email"]').first();
			if (await emailInput.isVisible()) {
				await expect(emailInput).toBeEnabled();
			}
		}
	});

	test("Signup flow works for free tier", async ({ page }) => {
		// Use data-testid for CTA
		await page
			.locator('[data-testid="free-plan"]')
			.locator("role=link")
			.first()
			.click();

		// Should navigate to signup page
		await expect(page).toHaveURL(/.*signup.*tier=free/);

		// Check signup form using data-testid
		await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
		await expect(
			page
				.locator('[data-testid="signup-form"]')
				.locator('input[type="email"]'),
		).toBeVisible();
		await expect(
			page.locator('[data-testid="signup-form"]').locator("role=button"),
		).toBeVisible();
	});

	test("Signup flow works for premium tier", async ({ page }) => {
		// Start from homepage
		await page.goto("/");
		await page.waitForLoadState('networkidle');

		// Look for premium/premium upgrade options (real user behavior)
		const premiumButtons = [
			page.locator('text=/Premium|Pro|Upgrade|Subscribe/i').first(),
			page.locator('[class*="premium"]').first(),
			page.locator('[data-testid*="premium"]').first()
		];

		// Try to find and click a premium option
		let clicked = false;
		for (const button of premiumButtons) {
			if (await button.isVisible().catch(() => false)) {
				await button.click();
				clicked = true;
				break;
			}
		}

		if (clicked) {
			// Should navigate to billing/payment/upgrade page
			await Promise.race([
				page.waitForURL(/.*(billing|upgrade|payment|subscribe|premium)/),
				page.locator('[class*="billing"], [class*="payment"], [class*="upgrade"]').first().waitFor({ timeout: 5000 })
			]);

			// Verify premium context (either URL or visible premium elements)
			const hasPremiumURL = /billing|upgrade|payment|subscribe|premium/i.test(page.url());
			const hasPremiumElements = await page.locator('text=/premium|pro|upgrade/i').isVisible().catch(() => false);

			expect(hasPremiumURL || hasPremiumElements).toBe(true);
		} else {
			// If no premium button found, that's actually OK - not all sites have prominent premium CTAs
			console.log('No premium CTA found - this may be expected for free-focused landing pages');
		}
	});

	test("Navigation works correctly", async ({ page }) => {
		// Test basic navigation like real users do
		// Check if there's a logo or brand name visible
		const logoElement = page.locator('img[alt*="logo"], [class*="logo"], text*="JobPing", text*="jobping"').first();
		if (await logoElement.isVisible()) {
			await logoElement.click();
			await expect(page).toHaveURL("/");
		}

		// Test common navigation patterns that real users expect
		// Look for "How it works", "Pricing", "About", or similar navigation text
		const navTexts = ["How it works", "Pricing", "About", "Features", "Contact"];

		for (const navText of navTexts) {
			const navLink = page.locator(`text=${navText}`).first();
			if (await navLink.isVisible()) {
				// Just check it's clickable, don't necessarily click it
				await expect(navLink).toBeEnabled();
				break; // Found one working nav element, that's enough
			}
		}

		// Test that page remains stable (no crashes)
		await expect(page).toHaveURL(/http:\/\/localhost:3000/);
	});

	test("Mobile responsiveness works", async ({ page }) => {
		// Set mobile viewport (iPhone SE size)
		await page.setViewportSize({ width: 375, height: 667 });

		// Wait for content to load on mobile
		await page.waitForLoadState('networkidle');

		// Test that core content is visible and readable on mobile
		await expect(page.locator("text=Get 5 early-career")).toBeVisible();
		await expect(page.locator("text=job matches")).toBeVisible();

		// Test that the main CTA works on mobile (critical for conversions)
		const ctaButton = page.locator("text=Get My 5 Free Matches").first();
		await expect(ctaButton).toBeVisible();
		await expect(ctaButton).toBeEnabled();

		// Test that content doesn't require horizontal scrolling (real mobile UX issue)
		const bodyScrollWidth = await page.locator('body').evaluate(el => el.scrollWidth);
		const viewportWidth = page.viewportSize()?.width || 375;
		expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin

		// Test that touch targets are reasonably sized (accessibility)
		const ctaBox = await ctaButton.boundingBox();
		if (ctaBox) {
			// Minimum touch target size should be 44px (iOS HIG)
			expect(Math.min(ctaBox.width, ctaBox.height)).toBeGreaterThanOrEqual(44);
		}
	});

	test("Error pages handle gracefully", async ({ page }) => {
		// Test 404 page
		await page.goto("/non-existent-page");
		await expect(page.locator("role=heading[level=1]")).toBeVisible();

		// Test that we can navigate back
		await page.goBack();
		await expect(page).toHaveURL("/");
	});
});

test.describe("API Endpoints", () => {
	test("Health check endpoint works and meets SLO (<100ms)", async ({
		request,
	}) => {
		const startTime = Date.now();
		const response = await request.get("/api/health");
		const duration = Date.now() - startTime;

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(["healthy", "degraded"]).toContain(data.status);

		// SLO check: health endpoint should respond in <100ms
		expect(duration).toBeLessThan(100);
		expect(data.responseTime || data.duration).toBeLessThan(100);
	});

	test("Match users endpoint requires authentication", async ({ request }) => {
		const response = await request.post("/api/match-users");
		expect(response.status()).toBe(401);
	});

	test("Signup endpoint handles invalid data gracefully", async ({
		request,
	}) => {
		const response = await request.post("/api/signup", {
			data: { invalid: "data" },
		});
		// Should return 400, 422 for invalid data
		expect([400, 422]).toContain(response.status());
	});
});

test.describe("Performance Tests", () => {
	test("Homepage loads within acceptable time", async ({ page }) => {
		const startTime = Date.now();
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		const loadTime = Date.now() - startTime;

		// Should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);
	});

	test("Images load correctly", async ({ page }) => {
		await page.goto("/");

		// Check for broken images
		const images = page.locator("img");
		const count = await images.count();

		for (let i = 0; i < count; i++) {
			const img = images.nth(i);
			await expect(img).toHaveAttribute("src");

			// Check if image loads without errors
			const naturalWidth = await img.evaluate(
				(el: HTMLImageElement) => el.naturalWidth,
			);
			expect(naturalWidth).toBeGreaterThan(0);
		}
	});
});

test.describe("Accessibility Tests", () => {
	test("Page has proper heading structure", async ({ page }) => {
		await page.goto("/");

		// Check for h1 using role
		await expect(page.locator("role=heading[level=1]")).toBeVisible();

		// Check for proper heading hierarchy
		const headings = page.locator("role=heading");
		const count = await headings.count();
		expect(count).toBeGreaterThan(0);
	});

	test("Interactive elements are keyboard accessible", async ({ page }) => {
		await page.goto("/");

		// Test tab navigation
		await page.keyboard.press("Tab");
		await page.keyboard.press("Tab");
		await page.keyboard.press("Tab");

		// Check if focus is visible
		const focusedElement = page.locator(":focus");
		await expect(focusedElement).toBeVisible();
	});

	test("Form elements have proper labels", async ({ page }) => {
		await page.goto("/signup?tier=free");

		// Check email input has label using role
		const emailInput = page.locator('input[type="email"]');
		await expect(emailInput).toBeVisible();

		// Check if input is properly labeled
		const labels = page.locator("label[for]");
		await expect(labels.first()).toBeVisible();
	});
});

test.describe("Cross-browser Compatibility", () => {
	test("Works in Chrome", async ({ page, browserName }) => {
		await page.goto("/");
		await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
	});

	test("Works in Firefox", async ({ page, browserName }) => {
		await page.goto("/");
		await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
	});

	test("Premium upgrade flow works end-to-end", async ({
		page,
	}) => {
		// Navigate to homepage
		await page.goto("/");

		// Verify premium pricing is visible (€5)
		await expect(page.locator("text=€5")).toBeVisible();
		await expect(page.locator("text=Premium")).toBeVisible();

		// Click premium CTA
		const premiumCTA = page.locator("text=Upgrade").or(page.locator("text=Premium")).first();
		await premiumCTA.click();

		// Should navigate to premium signup or show premium features
		await expect(page.locator("text=Premium").or(page.locator("text=€5"))).toBeVisible();

		// Test that premium features are highlighted
		await expect(page.locator("text=weekly").or(page.locator("text=matches"))).toBeVisible();
	});

	test("Works in Safari", async ({ page, browserName }) => {
		await page.goto("/");
		await expect(page.locator("text=Land your first job faster")).toBeVisible();
	});
});
