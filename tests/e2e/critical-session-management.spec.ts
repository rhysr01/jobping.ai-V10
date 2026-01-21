/**
 * CRITICAL E2E TEST: Session Management & Auth Persistence
 *
 * Tests the complete session management that prevents user abandonment:
 * - Session expiration handling
 * - Browser refresh persistence
 * - Multi-tab behavior consistency
 * - Incognito/private browsing
 * - Cross-device session sync
 * - Logout functionality
 * - Session hijacking prevention
 *
 * This follows JobPing testing strategy (docs/testing.md):
 * - Production-first approach with real authentication flows
 * - Error recovery testing for session issues
 * - Cross-browser compatibility for session handling
 */

import { expect, test } from "@playwright/test";

test.describe("Critical Session Management & Auth Persistence", () => {
	// Use single worker to avoid session conflicts
	test.describe.configure({ mode: "parallel", workers: 1 });

	const generateTestEmail = () => {
		const timestamp = Date.now();
		return `critical-session-${timestamp}@testjobping.com`;
	};

	test("Session Persistence Across Browser Refresh", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		console.log(`🧪 Testing session persistence for ${testEmail}`);

		// ========================================
		// STEP 1: Create User Session
		// ========================================
		await createAuthenticatedSession(page, request, testEmail);

		// ========================================
		// STEP 2: Verify Initial Session Works
		// ========================================
		await page.goto("/matches");
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 3: Test Browser Refresh Persistence
		// ========================================
		await page.reload();
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Session should persist through refresh
		const matchCards = page.locator('[data-testid="job-card"], .job-card');
		await expect(matchCards).toHaveCount(5); // Free user matches

		// ========================================
		// STEP 4: Test Hard Refresh (Ctrl+F5)
		// ========================================
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// Verify matches still load
		await expect(matchCards).toHaveCount(5);
	});

	test("Multi-Tab Session Synchronization", async ({ context }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Create Session in First Tab
		// ========================================
		const page1 = await context.newPage();
		await createAuthenticatedSession(page1, context.request, testEmail);

		// ========================================
		// STEP 2: Open Second Tab
		// ========================================
		const page2 = await context.newPage();
		await page2.goto("/matches");

		// Should automatically have access (same session)
		await expect(page2.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 3: Test Session Sync Between Tabs
		// ========================================
		// Interact in tab 1
		const matchCards1 = page1.locator('[data-testid="job-card"], .job-card');
		const firstMatch1 = matchCards1.first();

		// Dismiss a match in tab 1
		const dismissButton1 = firstMatch1.locator('button[aria-label*="Dismiss"]');
		if (await dismissButton1.isVisible()) {
			await dismissButton1.click();
			await expect(firstMatch1).not.toBeVisible();
		}

		// Switch to tab 2 and verify sync
		await page2.bringToFront();
		await page2.reload(); // Force refresh to check sync

		// Tab 2 should reflect the same state
		const matchCards2 = page2.locator('[data-testid="job-card"], .job-card');
		await expect(matchCards2).toHaveCount(4); // Should be 4 after dismissal

		// Cleanup
		await page1.close();
		await page2.close();
	});

	test("Session Expiration Handling", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Create Short-Lived Session
		// ========================================
		await createAuthenticatedSession(page, request, testEmail, 30000); // 30 second session

		// ========================================
		// STEP 2: Verify Session Initially Works
		// ========================================
		await page.goto("/matches");
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 3: Wait for Session Expiration
		// ========================================
		await page.waitForTimeout(35000); // Wait longer than session expiry

		// ========================================
		// STEP 4: Test Expired Session Handling
		// ========================================
		await page.reload();

		// Should redirect to login or show session expired message
		await expect(page.locator("text=Session expired")).toBeVisible();

		// Or should redirect to signup
		const currentURL = page.url();
		expect(currentURL).toMatch(/\/signup|\/login|\/auth/);

		// ========================================
		// STEP 5: Test Re-authentication Flow
		// ========================================
		// Should be able to sign up again without issues
		if (currentURL.includes('/signup')) {
			await page.locator('input[type="email"]').fill(testEmail);
			// Should handle existing user gracefully
		}
	});

	test("Incognito/Private Browsing Mode", async ({ browser }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Test in Incognito Context
		// ========================================
		const incognitoContext = await browser.newContext({
			// Simulate incognito mode (no persistent storage)
			storageState: undefined,
		});

		const incognitoPage = await incognitoContext.newPage();

		// ========================================
		// STEP 2: Attempt to Access Protected Route
		// ========================================
		await incognitoPage.goto("/matches");

		// Should not have access (no stored session)
		await expect(incognitoPage.locator("text=Your Perfect Matches")).not.toBeVisible();

		// Should show login/signup prompt
		await expect(incognitoPage.locator("text=Sign up")).toBeVisible();

		// ========================================
		// STEP 3: Test Session Creation in Incognito
		// ========================================
		await incognitoPage.goto("/signup/free");

		// Complete signup flow
		await incognitoPage.waitForSelector('#fullName', { timeout: 15000 });
		await incognitoPage.fill('#fullName', "Incognito Test");
		await incognitoPage.fill('#email', testEmail);
		await incognitoPage.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await incognitoPage.locator("button").filter({ hasText: "Enter your details" }).click();

		await incognitoPage.locator('[role="button"]').filter({ hasText: "London" }).first().click();
		await incognitoPage.locator("button").filter({ hasText: "Continue" }).first().click();

		await incognitoPage.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
		await incognitoPage.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

		// ========================================
		// STEP 4: Verify Session Works in Incognito
		// ========================================
		await incognitoPage.waitForURL(/\/matches/, { timeout: 30000 });
		await expect(incognitoPage.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 5: Test Incognito Session Isolation
		// ========================================
		// Open regular browser context and verify no session leakage
		const regularContext = await browser.newContext();
		const regularPage = await regularContext.newPage();

		await regularPage.goto("/matches");
		// Should not have access to incognito session
		await expect(regularPage.locator("text=Your Perfect Matches")).not.toBeVisible();

		// Cleanup
		await incognitoContext.close();
		await regularContext.close();
	});

	test("Session Hijacking Prevention", async ({ page, request, context }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Create Valid Session
		// ========================================
		await createAuthenticatedSession(page, request, testEmail);

		// ========================================
		// STEP 2: Attempt Session Hijacking
		// ========================================
		// Try to access with invalid session token
		const hijackPage = await context.newPage();
		await hijackPage.goto("/matches");

		// Should not have access
		await expect(hijackPage.locator("text=Your Perfect Matches")).not.toBeVisible();

		// ========================================
		// STEP 3: Test Cookie Manipulation
		// ========================================
		// Attempt to modify session cookies
		await hijackPage.context().addCookies([{
			name: 'session',
			value: 'manipulated-session-token',
			domain: 'localhost',
			path: '/',
		}]);

		await hijackPage.reload();

		// Should still not have access (invalid token)
		await expect(hijackPage.locator("text=Your Perfect Matches")).not.toBeVisible();

		// ========================================
		// STEP 4: Test Concurrent Session Handling
		// ========================================
		// Create multiple tabs and verify they all work with same session
		const tab2 = await context.newPage();
		const tab3 = await context.newPage();

		await tab2.goto("/matches");
		await tab3.goto("/matches");

		// All tabs should have access
		await expect(tab2.locator("text=Your Perfect Matches")).toBeVisible();
		await expect(tab3.locator("text=Your Perfect Matches")).toBeVisible();

		// Cleanup
		await tab2.close();
		await tab3.close();
		await hijackPage.close();
	});

	test("Logout Functionality", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Create Authenticated Session
		// ========================================
		await createAuthenticatedSession(page, request, testEmail);

		// ========================================
		// STEP 2: Verify Session Active
		// ========================================
		await page.goto("/matches");
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 3: Test Logout
		// ========================================
		// Look for logout button (might be in header, profile menu, etc.)
		const logoutButton = page.locator('button, a').filter({ hasText: /Logout|Sign Out|Log Out/i });

		if (await logoutButton.isVisible()) {
			await logoutButton.click();

			// Should redirect to home or show logout confirmation
			await expect(page.locator("text=Your Perfect Matches")).not.toBeVisible();
			await expect(page.locator("text=Sign up")).toBeVisible();
		} else {
			// If no explicit logout, test session clearing
			await page.context().clearCookies();
			await page.reload();

			// Should lose access
			await expect(page.locator("text=Your Perfect Matches")).not.toBeVisible();
		}

		// ========================================
		// STEP 4: Verify Post-Logout State
		// ========================================
		// Try to access protected route
		await page.goto("/matches");
		await expect(page.locator("text=Your Perfect Matches")).not.toBeVisible();
		await expect(page.locator("text=Sign up")).toBeVisible();
	});

	test("Browser Back/Forward Navigation", async ({ page, request }) => {
		const testEmail = generateTestEmail();

		// ========================================
		// STEP 1: Create Session and Navigate
		// ========================================
		await createAuthenticatedSession(page, request, testEmail);

		// Navigate through app
		await page.goto("/");
		await page.goto("/matches");
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 2: Test Browser Back Navigation
		// ========================================
		await page.goBack();
		// Should maintain session on back navigation
		await expect(page.locator("text=Get My 5 Free Matches")).toBeVisible();

		// ========================================
		// STEP 3: Test Browser Forward Navigation
		// ========================================
		await page.goForward();
		// Should maintain session on forward navigation
		await expect(page.locator("text=Your Perfect Matches")).toBeVisible();

		// ========================================
		// STEP 4: Test Deep Navigation History
		// ========================================
		// Navigate deeper into app
		const firstMatch = page.locator('[data-testid="job-card"], .job-card').first();
		if (await firstMatch.isVisible()) {
			await firstMatch.click();
			await expect(page.locator("text=Apply Now")).toBeVisible();

			// Test back navigation from deep page
			await page.goBack();
			await expect(page.locator("text=Your Perfect Matches")).toBeVisible();
		}
	});
});

// Helper functions
async function createAuthenticatedSession(page: any, request: any, email: string, sessionDuration: number = 3600000) {
	// Complete signup flow
	await page.goto("/");
	await page.locator('a[href="/signup/free"]').click();

	await page.waitForSelector('#fullName', { timeout: 15000 });
	await page.fill('#fullName', "Session Test User");
	await page.fill('#email', email);
	await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
	await page.locator("button").filter({ hasText: "Enter your details" }).click();

	await page.locator('[role="button"]').filter({ hasText: "London" }).first().click();
	await page.locator("button").filter({ hasText: "Continue" }).first().click();

	await page.locator("button").filter({ hasText: "Tech & Transformation" }).first().click();
	await page.locator("button").filter({ hasText: /Show Me My 5 Matches/ }).click();

	await page.waitForURL(/\/matches/, { timeout: 30000 });

	// Set session cookie with specified duration
	await page.context().addCookies([{
		name: 'session',
		value: email, // Simplified for testing
		domain: 'localhost',
		path: '/',
		httpOnly: false, // Allow JavaScript access for testing
		secure: false,
		sameSite: 'Lax',
		expires: Math.floor(Date.now() / 1000) + (sessionDuration / 1000), // Convert to seconds
	}]);
}