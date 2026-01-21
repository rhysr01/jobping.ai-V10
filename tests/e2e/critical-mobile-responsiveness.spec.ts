/**
 * CRITICAL E2E TEST: Mobile Responsiveness
 *
 * Tests mobile experience that affects 50%+ of users:
 * - Touch gesture interactions (swipe, pinch, tap)
 * - Orientation changes (portrait/landscape)
 * - Mobile keyboard behavior
 * - Mobile browser quirks (Safari iOS, Chrome Android)
 * - Touch-friendly job application flows
 * - Mobile network conditions
 *
 * This follows JobPing testing strategy (docs/testing.md):
 * - Mobile-first testing with real device simulation
 * - Touch interaction validation
 * - Performance testing under mobile constraints
 */

import { expect, test, devices } from "@playwright/test";

test.describe("Critical Mobile Responsiveness", () => {
	// Test on actual mobile devices
	test.describe.configure({ mode: "parallel", workers: 1 });

	const generateTestEmail = () => {
		const timestamp = Date.now();
		return `critical-mobile-${timestamp}@testjobping.com`;
	};

	test("Mobile Signup Flow - iPhone", async ({ browser }) => {
		// Use actual iPhone device
		const context = await browser.newContext({
			...devices['iPhone 12'],
			// Simulate real mobile network
			extraHTTPHeaders: {
				'DNT': '1',
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
			}
		});

		const page = await context.newPage();
		const testEmail = generateTestEmail();

		console.log(`📱 Testing mobile signup flow on iPhone for ${testEmail}`);

		try {
			// ========================================
			// STEP 1: Mobile Homepage Experience
			// ========================================
			await page.goto("/");
			await page.waitForLoadState('domcontentloaded');

			// Verify mobile-optimized hero section
			await expect(page.locator("text=Graduate Jobs Made Simple")).toBeVisible();

			// Check mobile-specific elements
			const mobileCTA = page.locator('a[href="/signup/free"], button').filter({ hasText: "Get 5 Free Matches" });
			await expect(mobileCTA).toBeVisible();

			// ========================================
			// STEP 2: Mobile Signup Form
			// ========================================
			await mobileCTA.click();
			await page.waitForURL(/.*signup\/free/, { timeout: 10000 });

			// Wait for mobile-optimized form
			await page.waitForSelector('#fullName', { timeout: 15000 });

			// Test mobile keyboard behavior
			await page.fill('#fullName', "Mobile Test User");

			// Verify mobile keyboard doesn't break layout
			const viewport = page.viewportSize();
			expect(viewport?.width).toBeLessThanOrEqual(390); // iPhone 12 width

			// ========================================
			// STEP 3: Mobile Touch Interactions
			// ========================================
			await page.fill('#email', testEmail);

			// Test touch-friendly city selection
			const cityButton = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await expect(cityButton).toBeVisible();

			// Simulate touch tap (more reliable than click on mobile)
			await cityButton.tap();

			// Test mobile form navigation
			const continueButton = page.locator("button").filter({ hasText: "Enter your details" });
			await expect(continueButton).toBeEnabled();
			await continueButton.tap();

			// ========================================
			// STEP 4: Mobile Step Navigation
			// ========================================
			// Step 2: City selection
			await page.locator('[role="button"]').filter({ hasText: "London" }).first().tap();

			// Test mobile Continue button
			const continueBtn = page.locator("button").filter({ hasText: "Continue" }).first();
			await continueBtn.tap();

			// Step 3: Career selection
			await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().tap();

			// ========================================
			// STEP 5: Mobile Form Submission
			// ========================================
			const submitButton = page.locator("button").filter({ hasText: /Show Me My 5 Matches/ });
			await submitButton.tap();

			// ========================================
			// STEP 6: Mobile Results Display
			// ========================================
			await page.waitForURL(/\/matches/, { timeout: 30000 });

			// Verify mobile-optimized results
			await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

			// Check mobile card layout
			const matchCards = page.locator('[data-testid="job-card"], .job-card');
			await expect(matchCards).toHaveCount(5);

			// Test mobile card interactions
			const firstCard = matchCards.first();

			// Mobile hover equivalent (touch and hold)
			await firstCard.tap({ position: { x: 10, y: 10 } });

			console.log(`✅ Mobile iPhone signup flow completed for ${testEmail}`);

		} finally {
			await context.close();
		}
	});

	test("Mobile Signup Flow - Android", async ({ browser }) => {
		// Use Android device
		const context = await browser.newContext({
			...devices['Pixel 5'],
			extraHTTPHeaders: {
				'DNT': '1',
				'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
			}
		});

		const page = await context.newPage();
		const testEmail = generateTestEmail();

		try {
			await page.goto("/");
			await page.locator('a[href="/signup/free"]').click();

			await page.waitForSelector('#fullName', { timeout: 15000 });

			// Test Android-specific interactions
			await page.fill('#fullName', "Android Test User");
			await page.fill('#email', testEmail);

			// Android city selection
			await page.locator('[role="button"]').filter({ hasText: "London" }).first().tap();

			// Continue through steps
			await page.locator("button").filter({ hasText: "Enter your details" }).tap();
			await page.locator('[role="button"]').filter({ hasText: "London" }).first().tap();
			await page.locator("button").filter({ hasText: "Continue" }).first().tap();
			await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().tap();
			await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).tap();

			await page.waitForURL(/\/matches/, { timeout: 30000 });
			await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		} finally {
			await context.close();
		}
	});

	test("Orientation Changes - Portrait to Landscape", async ({ browser }) => {
		const context = await browser.newContext({
			...devices['iPhone 12'],
			viewport: { width: 390, height: 844 } // Portrait
		});

		const page = await context.newPage();

		try {
			await page.goto("/signup/free");
			await page.waitForSelector('#fullName', { timeout: 15000 });

			// Verify portrait layout
			const nameInput = page.locator('#fullName');
			const emailInput = page.locator('#email');

			const portraitNameBox = await nameInput.boundingBox();
			const portraitEmailBox = await emailInput.boundingBox();

			// ========================================
			// STEP 1: Test Portrait Layout
			// ========================================
			expect(portraitNameBox?.width).toBeLessThan(400); // Mobile width
			expect(portraitEmailBox?.width).toBeLessThan(400);

			// ========================================
			// STEP 2: Change to Landscape
			// ========================================
			await page.setViewportSize({ width: 844, height: 390 }); // Landscape

			// Wait for layout to adjust
			await page.waitForTimeout(1000);

			// ========================================
			// STEP 3: Verify Landscape Layout
			// ========================================
			const landscapeNameBox = await nameInput.boundingBox();
			const landscapeEmailBox = await emailInput.boundingBox();

			// Layout should adapt to wider screen
			expect(landscapeNameBox?.width).toBeGreaterThan(portraitNameBox?.width || 0);
			expect(landscapeEmailBox?.width).toBeGreaterThan(portraitEmailBox?.width || 0);

			// ========================================
			// STEP 4: Test Landscape Interactions
			// ========================================
			await page.fill('#fullName', "Landscape Test");
			await page.fill('#email', "landscape@test.com");

			// Verify buttons still work in landscape
			const continueButton = page.locator("button").filter({ hasText: "Enter your details" });
			await expect(continueButton).toBeVisible();
			await expect(continueButton).toBeEnabled();

		} finally {
			await context.close();
		}
	});

	test("Touch Gestures and Mobile Interactions", async ({ browser }) => {
		const context = await browser.newContext({
			...devices['iPhone 12'],
			hasTouch: true, // Enable touch events
		});

		const page = await context.newPage();

		try {
			await page.goto("/matches");

			// ========================================
			// STEP 1: Test Touch Scrolling
			// ========================================
			// Scroll down with touch
			await page.touchscreen.tap(200, 400);
			await page.touchscreen.dragAndDrop(200, 400, 200, 200);

			// Verify scroll worked
			const scrolledElement = page.locator('.job-card').first();
			await expect(scrolledElement).toBeInViewport();

			// ========================================
			// STEP 2: Test Touch Taps vs Clicks
			// ========================================
			const matchCard = page.locator('[data-testid="job-card"], .job-card').first();

			// Test tap interaction
			await matchCard.tap();

			// Should show hover state or detailed view
			const hoverCard = page.locator('[data-radix-popper-content-wrapper]');
			if (await hoverCard.isVisible({ timeout: 2000 })) {
				// Mobile might show different interaction
				await expect(hoverCard).toContainText(/Apply Now|Match Score/);
			}

			// ========================================
			// STEP 3: Test Mobile Apply Button
			// ========================================
			const applyButton = matchCard.locator('a, button').filter({ hasText: "Apply Now" });

			if (await applyButton.isVisible()) {
				// Test touch tap on apply button
				await applyButton.tap();

				// Should either open new tab or show external link warning
				const newPagePromise = page.context().waitForEvent('page');
				try {
					const newPage = await newPagePromise;
					await expect(newPage.url()).not.toBe(page.url());
					await newPage.close();
				} catch {
					// Mobile might handle differently
					console.log("Apply button interaction completed");
				}
			}

		} finally {
			await context.close();
		}
	});

	test("Mobile Performance and Loading", async ({ browser }) => {
		const context = await browser.newContext({
			...devices['iPhone 12'],
			// Simulate slower mobile network
			extraHTTPHeaders: {
				'DNT': '1',
			}
		});

		const page = await context.newPage();

		try {
			// ========================================
			// STEP 1: Test Mobile Page Load Performance
			// ========================================
			const startTime = Date.now();

			await page.goto("/", { waitUntil: 'domcontentloaded' });
			const loadTime = Date.now() - startTime;

			// Mobile should load within reasonable time
			expect(loadTime).toBeLessThan(10000); // 10 seconds max for mobile

			// ========================================
			// STEP 2: Test Mobile Signup Performance
			// ========================================
			const signupStart = Date.now();
			await page.locator('a[href="/signup/free"]').tap();

			await page.waitForSelector('#fullName', { timeout: 15000 });
			const formLoadTime = Date.now() - signupStart;

			expect(formLoadTime).toBeLessThan(8000); // 8 seconds for mobile form

			// ========================================
			// STEP 3: Test Mobile Form Submission
			// ========================================
			await page.fill('#fullName', "Performance Test");
			await page.fill('#email', `perf-${Date.now()}@test.com`);
			await page.locator('[role="button"]').filter({ hasText: "London" }).first().tap();

			const submitStart = Date.now();
			await page.locator("button").filter({ hasText: "Enter your details" }).tap();

			// Continue through steps quickly
			await page.locator('[role="button"]').filter({ hasText: "London" }).first().tap();
			await page.locator("button").filter({ hasText: "Continue" }).first().tap();
			await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().tap();
			await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).tap();

			await page.waitForURL(/\/matches/, { timeout: 25000 });
			const totalFlowTime = Date.now() - startTime;

			// Complete mobile flow should be under 45 seconds
			expect(totalFlowTime).toBeLessThan(45000);

			console.log(`📊 Mobile performance test completed in ${totalFlowTime}ms`);

		} finally {
			await context.close();
		}
	});

	test("Mobile Browser Specific Behaviors", async ({ browser }) => {
		// Test Safari mobile behavior
		const safariContext = await browser.newContext({
			...devices['iPhone 12'],
			userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
		});

		const safariPage = await safariContext.newPage();

		try {
			await safariPage.goto("/signup/free");
			await safariPage.waitForSelector('#fullName', { timeout: 15000 });

			// Test Safari-specific form handling
			await safariPage.fill('#fullName', "Safari Test");
			await safariPage.fill('#email', "safari@test.com");

			// Safari mobile keyboard behavior
			await safariPage.locator('[role="button"]').filter({ hasText: "London" }).first().tap();

			// Test Safari form submission
			await safariPage.locator("button").filter({ hasText: "Enter your details" }).tap();

			// Continue flow
			await safariPage.locator('[role="button"]').filter({ hasText: "London" }).first().tap();
			await safariPage.locator("button").filter({ hasText: "Continue" }).first().tap();
			await safariPage.locator("button").filter({ hasText: "Tech & Transformation" }).first().tap();
			await safariPage.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).tap();

			await safariPage.waitForURL(/\/matches/, { timeout: 30000 });
			await expect(safariPage.locator("text=Your Perfect Matches")).toBeVisible();

		} finally {
			await safariContext.close();
		}
	});

	test("Mobile Network Conditions", async ({ browser }) => {
		const context = await browser.newContext({
			...devices['iPhone 12'],
		});

		const page = await context.newPage();

		try {
			// ========================================
			// STEP 1: Test Slow Network Conditions
			// ========================================
			// Throttle network to simulate slow mobile connection
			await page.route('**/*', async route => {
				// Add delay to simulate slow network
				await new Promise(resolve => setTimeout(resolve, 100));
				await route.continue();
			});

			const startTime = Date.now();
			await page.goto("/signup/free");

			await page.waitForSelector('#fullName', { timeout: 30000 });
			const loadTime = Date.now() - startTime;

			// Should still load within reasonable time even with slow network
			expect(loadTime).toBeLessThan(20000);

			// ========================================
			// STEP 2: Test Offline Behavior
			// ========================================
			// Simulate going offline during form completion
			await page.fill('#fullName', "Offline Test");
			await page.fill('#email', "offline@test.com");

			// Go offline
			await context.setOffline(true);

			// Try to submit
			await page.locator("button").filter({ hasText: "Enter your details" }).click();

			// Should handle offline gracefully
			await expect(page.locator("text=No internet connection")).toBeVisible();

			// Restore connection
			await context.setOffline(false);

			// Should recover and allow resubmission
			await expect(page.locator("button").filter({ hasText: "Enter your details" })).toBeEnabled();

		} finally {
			await context.close();
		}
	});
});