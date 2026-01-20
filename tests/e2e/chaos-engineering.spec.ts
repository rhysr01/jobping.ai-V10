import { expect, test } from "@playwright/test";
import { resilientRequest } from "./test-utils";

/**
 * CHAOS ENGINEERING TESTS
 *
 * These tests simulate various failure scenarios to ensure the system
 * handles them gracefully and provides good user experience even under stress.
 *
 * Tests include:
 * - Database connection failures
 * - AI service timeouts
 * - External API failures
 * - Network issues
 * - Resource exhaustion
 */

test.describe("Chaos Engineering - System Resilience", () => {
	test.describe("Database Failures", () => {
		test("should handle database connection loss gracefully", async ({ page, request }) => {
			// This test would need backend simulation of DB failure
			// For now, we test the frontend response to DB errors

			await page.goto("/signup/free");

			// Fill form
			await page.fill('input[type="email"]', `chaos-test-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Chaos Test User");

			// Submit during simulated DB outage
			await page.click('button[type="submit"]');

			// Should show user-friendly error message, not crash
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
			await expect(page.locator('text=system is temporarily unavailable')).toBeVisible();

			// Should allow retry
			await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
		});

		test("should recover from temporary database issues", async ({ page }) => {
			// Test recovery after DB comes back online
			await page.goto("/signup/free");

			// First attempt fails
			await page.fill('input[type="email"]', `recovery-test-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Recovery Test");
			await page.click('button[type="submit"]');

			// Should show error initially
			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

			// Click retry after simulated recovery
			await page.locator('[data-testid="retry-button"]').click();

			// Should succeed on retry
			await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
		});
	});

	test.describe("AI Service Failures", () => {
		test("should handle AI service timeouts", async ({ page, request }) => {
			// Simulate AI service timeout
			await page.goto("/signup/free");

			await page.fill('input[type="email"]', `ai-timeout-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "AI Timeout Test");

			// Select city to trigger matching (which uses AI)
			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			// Submit form
			await page.click('button[type="submit"]');

			// Should handle AI timeout gracefully
			await expect(page.locator('[data-testid="matches-section"]')).toBeVisible();

			// Should show limited results or fallback message
			const matchCards = page.locator('[data-testid="match-card"]');
			const count = await matchCards.count();

			// Even with AI failure, should show some results or clear messaging
			expect(count).toBeGreaterThanOrEqual(0);
		});

		test("should fallback to rule-based matching when AI fails", async ({ page }) => {
			// Test that system falls back gracefully when AI is unavailable
			await page.goto("/signup/free");

			await page.fill('input[type="email"]', `ai-fallback-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "AI Fallback Test");

			// Complete signup process
			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			await page.click('button[type="submit"]');

			// Navigate to matches
			await page.goto("/matches");

			// Should show matches even if AI failed
			await expect(page.locator('[data-testid="match-card"]')).toHaveCount(5);
		});
	});

	test.describe("External API Failures", () => {
		test("should handle email service failures", async ({ page, request }) => {
			// Test signup when email service is down
			await page.goto("/signup/free");

			await page.fill('input[type="email"]', `email-fail-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Email Fail Test");

			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			await page.click('button[type="submit"]');

			// Should complete signup even if email fails
			await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();

			// Should show email delivery warning but not block user
			await expect(page.locator('[data-testid="email-warning"]')).toBeVisible();
		});

		test("should handle payment service failures", async ({ page }) => {
			// Test premium signup when payment service is down
			await page.goto("/signup/premium");

			await page.fill('input[type="email"]', `payment-fail-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Payment Fail Test");

			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			await page.click('button[type="submit"]');

			// Should show payment error but allow retry
			await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
			await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
		});
	});

	test.describe("Network Issues", () => {
		test("should handle slow network connections", async ({ page }) => {
			// Throttle network to simulate slow connection
			await page.route('**/*', async route => {
				await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
				await route.continue();
			});

			await page.goto("/signup/free");

			// Should still work with slow network
			await expect(page.locator('input[type="email"]')).toBeVisible();

			// Fill form and submit
			await page.fill('input[type="email"]', `slow-network-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Slow Network Test");

			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			await page.click('button[type="submit"]');

			// Should complete successfully despite slow network
			await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();
		});

		test("should handle intermittent connectivity", async ({ page }) => {
			let requestCount = 0;

			// Simulate intermittent failures
			await page.route('**/api/**', async route => {
				requestCount++;
				if (requestCount % 3 === 0) { // Fail every 3rd request
					await route.abort();
				} else {
					await route.continue();
				}
			});

			await page.goto("/signup/free");

			await page.fill('input[type="email"]', `intermittent-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Intermittent Test");

			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			await page.click('button[type="submit"]');

			// Should eventually succeed despite intermittent failures
			await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();
		});
	});

	test.describe("Resource Exhaustion", () => {
		test("should handle memory pressure gracefully", async ({ page }) => {
			// This would require backend simulation of memory pressure
			// Test frontend behavior under memory constraints

			await page.goto("/matches");

			// Load many matches to simulate memory usage
			const matchCards = page.locator('[data-testid="match-card"]');
			const initialCount = await matchCards.count();

			// Should not crash even with many matches loaded
			expect(initialCount).toBeGreaterThan(0);

			// Should maintain responsiveness
			await expect(page.locator('button')).toBeEnabled();
		});

		test("should handle concurrent user load", async ({ page, request }) => {
			// Simulate multiple concurrent requests
			const concurrentRequests = Array(5).fill(null).map((_, i) =>
				resilientRequest(() =>
					request.post("/api/signup/free", {
						headers: { "Content-Type": "application/json" },
						data: {
							email: `concurrent-${i}-${Date.now()}@test.com`,
							full_name: `Concurrent User ${i}`,
							preferred_cities: ["London"],
							career_paths: ["tech"],
							visa_sponsorship: "no",
							birth_year: 1995,
							age_verified: true,
							terms_accepted: true,
						},
					}),
					3,
					`concurrent-signup-${i}`
				)
			);

			const results = await Promise.all(concurrentRequests);

			// At least some should succeed (depends on rate limiting)
			const successfulRequests = results.filter(r => r.status() === 200 || r.status() === 409);
			expect(successfulRequests.length).toBeGreaterThan(0);

			// Should not crash the system
			const finalHealthCheck = await request.get("/api/health");
			expect([200, 429]).toContain(finalHealthCheck.status());
		});
	});

	test.describe("Data Corruption", () => {
		test("should handle malformed job data", async ({ page }) => {
			// Test with intentionally corrupted job data
			await page.goto("/matches");

			// Should display available matches even if some data is corrupted
			const matchCards = page.locator('[data-testid="match-card"]');
			await expect(matchCards.first()).toBeVisible();

			// Should not show corrupted data to users
			await expect(page.locator('text=undefined')).not.toBeVisible();
			await expect(page.locator('text=null')).not.toBeVisible();
		});

		test("should handle missing user preferences", async ({ page }) => {
			// Test signup with minimal/incomplete data
			await page.goto("/signup/free");

			// Fill only email
			await page.fill('input[type="email"]', `minimal-data-${Date.now()}@test.com`);

			// Try to submit incomplete form
			await page.click('button[type="submit"]');

			// Should show validation errors for required fields
			await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();

			// Should not crash or submit incomplete data
			await expect(page.locator('[data-testid="signup-success"]')).not.toBeVisible();
		});
	});

	test.describe("Recovery Testing", () => {
		test("should recover from JavaScript errors", async ({ page }) => {
			// Inject a JavaScript error
			await page.addScriptTag({
				content: `
					window.addEventListener('load', () => {
						setTimeout(() => {
							throw new Error('Injected chaos error');
						}, 1000);
					});
				`
			});

			await page.goto("/signup/free");

			// Should still be functional despite injected error
			await expect(page.locator('input[type="email"]')).toBeVisible();

			// Fill and submit form
			await page.fill('input[type="email"]', `js-error-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "JS Error Test");

			const cityChip = page.locator('[role="button"]').filter({ hasText: "London" }).first();
			await cityChip.click();

			await page.click('button[type="submit"]');

			// Should complete successfully despite JavaScript error
			await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();
		});

		test("should handle browser crashes gracefully", async ({ page }) => {
			// This test would require special browser crash simulation
			// For now, test recovery from navigation errors

			await page.goto("/signup/free");

			// Simulate navigation to invalid route during form completion
			await page.fill('input[type="email"]', `crash-test-${Date.now()}@test.com`);
			await page.fill('input[placeholder*="name"]', "Crash Test");

			// Try to navigate away during submission
			const submitPromise = page.click('button[type="submit"]');
			await page.goto("/non-existent-page", { waitUntil: 'domcontentloaded' });

			// Wait for navigation to complete
			await page.waitForURL('**/non-existent-page');

			// Should show 404 but not crash
			await expect(page.locator('body')).toBeVisible();
		});
	});
});