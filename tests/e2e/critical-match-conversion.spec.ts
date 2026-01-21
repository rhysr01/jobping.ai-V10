/**
 * CRITICAL E2E TEST: Match Interaction & Conversion
 *
 * Tests the complete match interaction flow that is CRITICAL for user conversion:
 * - Clicking "Apply Now" buttons and external navigation
 * - Application tracking and analytics
 * - Match refresh/regeneration
 * - Job detail modal interactions
 * - User engagement with match results
 *
 * This follows JobPing testing strategy (docs/testing.md):
 * - Production-first approach with real user conversion flows
 * - Complete user journey validation from match to application
 * - Performance monitoring for conversion funnels
 */

import { expect, test } from "@playwright/test";

test.describe("Critical Match Interaction & Conversion", () => {
	// Use single worker to avoid conflicts and ensure sequential testing
	test.describe.configure({ mode: "parallel", workers: 1 });

	const generateTestEmail = () => {
		const timestamp = Date.now();
		return `critical-match-${timestamp}@testjobping.com`;
	};

	test("Complete Free User Match Interaction Journey", async ({ page, request, context }) => {
		const testEmail = generateTestEmail();

		console.log(`🧪 Testing critical match interaction for ${testEmail}`);

		// ========================================
		// STEP 1: Create Free User with Matches
		// ========================================
		// Complete free signup flow
		await page.goto("/");

		// Homepage → Signup
		await page.locator('a[href="/signup/free"]').click();
		await expect(page).toHaveURL(/.*signup\/free/);

		// Complete free signup form
		await page.waitForSelector('#fullName', { timeout: 15000 });
		await page.fill('#fullName', "Match Interaction Test");
		await page.fill('#email', testEmail);
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Enter your details" }).click();

		// Step 2: Cities
		await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await page.locator("button").filter({ hasText: "Continue" }).first().click();

		// Step 3: Career + Submit
		await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// ========================================
		// STEP 2: Verify Matches Display
		// ========================================
		await page.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Verify exactly 5 matches for free users
		const matchCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(matchCards).toHaveCount(5);

		// ========================================
		// STEP 3: Test Match Card Interactions
		// ========================================
		const firstMatchCard = matchCards.first();

		// Test hover card functionality (detailed job info on hover)
		await firstMatchCard.hover();
		// Should show hover card with detailed information
		await expect(page.locator('[data-radix-popper-content-wrapper]')).toBeVisible();

		// ========================================
		// STEP 4: Test Apply Button Click (Critical Conversion)
		// ========================================
		// Click "Apply Now" button on first match
		const applyButton = firstMatchCard.locator('a, button').filter({ hasText: "Apply Now" });
		await expect(applyButton).toBeVisible();

		// Monitor for new page/popup (external job site navigation)
		const [newPage] = await Promise.all([
			context.waitForEvent('page'), // Wait for new tab to open
			applyButton.click() // Click apply button
		]);

		// Verify external navigation occurred
		await expect(newPage.url()).not.toBe(page.url()); // Should navigate to external job site

		// Switch back to main page
		await page.bringToFront();

		// ========================================
		// STEP 5: Test Application Tracking
		// ========================================
		// Verify application was tracked (should show applied status)
		// Note: In production, this would update the match status
		await expect(page.locator("text=Applied")).toBeVisible(); // Implementation dependent

		// ========================================
		// STEP 6: Test Match Dismissal
		// ========================================
		const dismissButton = firstMatchCard.locator('button[aria-label*="Dismiss"]');
		if (await dismissButton.isVisible()) {
			await dismissButton.click();

			// Match should be removed from view
			await expect(firstMatchCard).not.toBeVisible();

			// Should now show 4 matches
			await expect(matchCards).toHaveCount(4);
		}

		// ========================================
		// STEP 7: Test Match Refresh/Regeneration
		// ========================================
		// Look for refresh/regenerate button (if exists)
		const refreshButton = page.locator('button, a').filter({ hasText: /Refresh|Regenerate|New Matches/i });
		if (await refreshButton.isVisible()) {
			await refreshButton.click();

			// Should show loading state
			await expect(page.locator("text=Loading")).toBeVisible();

			// Should eventually show new matches
			await page.waitForTimeout(3000); // Allow time for regeneration
			await expect(matchCards.first()).toBeVisible();
		}

		// ========================================
		// STEP 8: Test Premium Upgrade Prompt
		// ========================================
		// Free users should see upgrade prompts
		await expect(page.locator("text=Upgrade")).toBeVisible();
		await expect(page.locator("text=Premium")).toBeVisible();
		await expect(page.locator("text=15 matches")).toBeVisible();

		console.log(`✅ Critical match interaction flow completed for ${testEmail}`);
	});

	test("Premium User Advanced Match Interactions", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Create Premium User with Matches
		// ========================================
		// Complete premium signup and payment flow
		await createVerifiedPremiumUser(page, request, testEmail);

		// ========================================
		// STEP 2: Verify Premium Match Display
		// ========================================
		await page.goto("/matches");
		await expect(page.locator("text=Your Premium Matches")).toBeVisible();

		// Verify exactly 15 matches for premium users
		const matchCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		await expect(matchCards).toHaveCount(15);

		// ========================================
		// STEP 3: Test Premium Match Features
		// ========================================
		const firstCard = matchCards.first();

		// Premium users should see enhanced match information
		await expect(firstCard.locator("text=Match Score")).toBeVisible();
		await expect(firstCard.locator("text=% match")).toBeVisible();

		// Should show company quality indicators
		await expect(firstCard).toContainText(/€|\$|£/); // Salary information
		await expect(firstCard).toContainText(/Remote|Hybrid|Office/); // Work environment

		// ========================================
		// STEP 4: Test Match Filtering (Premium Feature)
		// ========================================
		// Look for filter controls
		const remoteFilter = page.locator('button, [role="button"]').filter({ hasText: "Remote" });
		if (await remoteFilter.isVisible()) {
			const initialCount = await matchCards.count();

			await remoteFilter.click();

			// Should filter matches (count should change or stay same)
			await page.waitForTimeout(1000); // Allow filtering to complete
			const filteredCount = await matchCards.count();

			// Either stays same (no remote jobs) or decreases (filtered out)
			expect(filteredCount).toBeLessThanOrEqual(initialCount);
		}

		// ========================================
		// STEP 5: Test Match Export (Premium Feature)
		// ========================================
		const exportButton = page.locator('button, a').filter({ hasText: /Export|Download|Save/i });
		if (await exportButton.isVisible()) {
			// Click export and verify functionality
			const [download] = await Promise.all([
				page.waitForEvent('download'), // Wait for download to start
				exportButton.click()
			]);

			// Verify download started
			expect(download.suggestedFilename()).toMatch(/\.(csv|json|pdf)$/);
		}

		// ========================================
		// STEP 6: Test Bulk Actions (Premium Feature)
		// ========================================
		// Test selecting multiple matches
		const selectAllCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Select All/i });
		if (await selectAllCheckbox.isVisible()) {
			await selectAllCheckbox.check();

			// Should show bulk action buttons
			const bulkApplyButton = page.locator('button').filter({ hasText: /Apply Selected|Bulk Apply/i });
			await expect(bulkApplyButton).toBeVisible();

			// Uncheck to clean up
			await selectAllCheckbox.uncheck();
		}
	});

	test("Match Application Analytics Tracking", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// Create free user with matches
		await createFreeUserWithMatches(page, request, testEmail);

		// ========================================
		// STEP 1: Test Application Click Tracking
		// ========================================
		const matchCards = page.locator('[data-testid="job-card"], .job-card, [class*="job-"]');
		const firstCard = matchCards.first();

		// Get initial analytics data
		const initialClicks = await getAnalyticsCount(testEmail, 'job_link_clicked');

		// Click apply button
		const applyButton = firstCard.locator('a, button').filter({ hasText: "Apply Now" });
		await applyButton.click();

		// Verify analytics were recorded
		await page.waitForTimeout(2000); // Allow analytics to be sent
		const finalClicks = await getAnalyticsCount(testEmail, 'job_link_clicked');
		expect(finalClicks).toBeGreaterThan(initialClicks);

		// ========================================
		// STEP 2: Test Job View Tracking
		// ========================================
		const secondCard = matchCards.nth(1);
		await secondCard.click(); // Click to view details

		// Verify job view was tracked
		const jobViews = await getAnalyticsCount(testEmail, 'job_viewed');
		expect(jobViews).toBeGreaterThan(0);
	});

	test("Match Performance Under Load", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// Create user with many matches
		await createPremiumUserWithMatches(page, request, testEmail);

		// ========================================
		// STEP 1: Test Match Loading Performance
		// ========================================
		const startTime = Date.now();

		await page.goto("/matches");
		await page.waitForSelector('[data-testid="job-card"], .job-card', { timeout: 10000 });

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

		// ========================================
		// STEP 2: Test Interaction Performance
		// ========================================
		const matchCards = page.locator('[data-testid="job-card"], .job-card');
		const interactionTimes: number[] = [];

		// Test interaction performance for first 5 matches
		for (let i = 0; i < Math.min(5, await matchCards.count()); i++) {
			const card = matchCards.nth(i);
			const interactStart = Date.now();

			await card.hover(); // Test hover performance
			const hoverTime = Date.now() - interactStart;
			interactionTimes.push(hoverTime);

			// Small delay to avoid overwhelming
			await page.waitForTimeout(100);
		}

		// Average interaction time should be under 500ms
		const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
		expect(avgInteractionTime).toBeLessThan(500);
	});

	test("Match Error Recovery Scenarios", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		await createFreeUserWithMatches(page, request, testEmail);

		// ========================================
		// STEP 1: Test Broken Job Links
		// ========================================
		// Simulate clicking on a job with broken link
		const matchCards = page.locator('[data-testid="job-card"], .job-card');
		const firstCard = matchCards.first();

		// Mock a broken job URL by intercepting the navigation
		await page.route('**/broken-job-url/**', route => route.abort());

		// Click apply button (should handle error gracefully)
		const applyButton = firstCard.locator('a, button').filter({ hasText: "Apply Now" });
		await applyButton.click();

		// Should show error message instead of breaking
		await expect(page.locator("text=Application link unavailable")).toBeVisible();

		// ========================================
		// STEP 2: Test Network Failure During Apply
		// ========================================
		// Simulate network failure
		await page.context().setOffline(true);

		await applyButton.click();

		// Should handle offline gracefully
		await expect(page.locator("text=No internet connection")).toBeVisible();

		// Restore connection
		await page.context().setOnline(true);
	});
});

// Helper functions
async function createFreeUserWithMatches(page: any, request: any, email: string) {
	// Complete free signup flow
	await page.goto("/");
	await page.locator('a[href="/signup/free"]').click();

	await page.waitForSelector('#fullName', { timeout: 15000 });
	await page.fill('#fullName', "Test User");
	await page.fill('#email', email);
	await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
	await page.locator("button").filter({ hasText: "Enter your details" }).click();

	await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
	await page.locator("button").filter({ hasText: "Continue" }).first().click();

	await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
	await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

	await page.waitForURL(/\/matches/, { timeout: 30000 });
}

async function createVerifiedPremiumUser(page: any, request: any, email: string) {
	// Complete premium signup and mock verification/payment
	await request.post("/api/signup", {
		data: {
			fullName: "Premium Test User",
			email,
			cities: ["London", "Berlin"],
			languages: ["English"],
			careerPath: "tech",
			experience: "entry",
			workEnvironment: ["hybrid"],
			visaStatus: "eu-citizen",
			gdprConsent: true,
		},
	});

	// Mock verification and payment
	const verificationToken = await getVerificationTokenFromDatabase(email);
	await request.post("/api/verify-email", { data: { email, token: verificationToken } });

	// Mock successful payment
	const supabase = (await import("../../utils/core/database-pool")).getDatabaseClient();
	await supabase.from("users").update({
		subscription_active: true,
		subscription_tier: "premium"
	}).eq("email", email);
}

async function createPremiumUserWithMatches(page: any, request: any, email: string) {
	await createVerifiedPremiumUser(page, request, email);
	// Additional setup for premium matches if needed
}

async function getVerificationTokenFromDatabase(email: string): Promise<string> {
	const supabase = (await import("../../utils/core/database-pool")).getDatabaseClient();
	const { data } = await supabase
		.from("email_verifications")
		.select("token")
		.eq("email", email)
		.eq("verified", false)
		.order("created_at", { ascending: false })
		.limit(1)
		.single();

	return data?.token || "test-verification-token";
}

async function getAnalyticsCount(email: string, eventType: string): Promise<number> {
	// In production, this would query analytics database
	// For testing, return mock data
	const supabase = (await import("../../utils/core/database-pool")).getDatabaseClient();

	// Mock analytics query - in real implementation would query analytics table
	const { count } = await supabase
		.from("analytics_events")
		.select("*", { count: "exact", head: true })
		.eq("user_email", email)
		.eq("event_type", eventType);

	return count || 0;
}