import { expect, test } from "@playwright/test";

/**
 * COMPONENT-LEVEL PLAYWRIGHT TESTS
 *
 * These tests focus on individual UI components and their interactions,
 * providing faster feedback than full E2E tests while still testing
 * real browser behavior.
 */

test.describe("Component Testing", () => {
	test.describe("Button Component", () => {
		test("should render with correct variants", async ({ page }) => {
			await page.goto("/components/button"); // Assuming you have a component demo page

			// Test primary button
			const primaryButton = page.locator('[data-testid="button-primary"]');
			await expect(primaryButton).toBeVisible();

			// Test secondary button
			const secondaryButton = page.locator('[data-testid="button-secondary"]');
			await expect(secondaryButton).toBeVisible();

			// Test disabled button
			const disabledButton = page.locator('[data-testid="button-disabled"]');
			await expect(disabledButton).toBeDisabled();
		});

		test("should handle click interactions", async ({ page }) => {
			await page.goto("/components/button");

			const button = page.locator('[data-testid="clickable-button"]');
			await button.click();

			// Verify click handler was called (check for some visual feedback)
			await expect(page.locator('[data-testid="click-feedback"]')).toBeVisible();
		});
	});

	test.describe("Form Components", () => {
		test("should handle input validation", async ({ page }) => {
			await page.goto("/components/form");

			const emailInput = page.locator('input[type="email"]');

			// Test valid email
			await emailInput.fill("test@example.com");
			await expect(emailInput).toHaveAttribute("aria-invalid", "false");

			// Test invalid email
			await emailInput.fill("invalid-email");
			await emailInput.blur(); // Trigger validation
			await expect(emailInput).toHaveAttribute("aria-invalid", "true");
		});

		test("should show loading states", async ({ page }) => {
			await page.goto("/components/form");

			const submitButton = page.locator('button[type="submit"]');

			// Fill form and submit
			await page.fill('input[type="email"]', "test@example.com");
			await submitButton.click();

			// Check for loading state
			await expect(submitButton).toHaveAttribute("aria-disabled", "true");
			await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
		});
	});

	test.describe("Modal/Dialog Components", () => {
		test("should open and close correctly", async ({ page }) => {
			await page.goto("/components/modal");

			const openButton = page.locator('[data-testid="open-modal"]');
			const modal = page.locator('[data-testid="modal"]');
			const closeButton = page.locator('[data-testid="close-modal"]');

			// Modal should not be visible initially
			await expect(modal).not.toBeVisible();

			// Open modal
			await openButton.click();
			await expect(modal).toBeVisible();

			// Close modal
			await closeButton.click();
			await expect(modal).not.toBeVisible();
		});

		test("should handle keyboard navigation", async ({ page }) => {
			await page.goto("/components/modal");

			const openButton = page.locator('[data-testid="open-modal"]');
			await openButton.click();

			// Test ESC key closes modal
			await page.keyboard.press("Escape");
			await expect(page.locator('[data-testid="modal"]')).not.toBeVisible();
		});

		test("should trap focus within modal", async ({ page }) => {
			await page.goto("/components/modal");

			const openButton = page.locator('[data-testid="open-modal"]');
			await openButton.click();

			// Tab should cycle through focusable elements within modal
			await page.keyboard.press("Tab");
			const focusedElement = page.locator(":focus");
			await expect(focusedElement).toBeVisible();

			// Should not be able to tab outside modal
			await expect(focusedElement).toBeWithin(page.locator('[data-testid="modal"]'));
		});
	});

	test.describe("Navigation Components", () => {
		test("should handle mobile menu toggle", async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport

			await page.goto("/");

			const menuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
			const mobileMenu = page.locator('[data-testid="mobile-menu"]');

			// Menu should be hidden initially
			await expect(mobileMenu).not.toBeVisible();

			// Open menu
			await menuToggle.click();
			await expect(mobileMenu).toBeVisible();

			// Close menu
			await menuToggle.click();
			await expect(mobileMenu).not.toBeVisible();
		});

		test("should highlight active navigation items", async ({ page }) => {
			await page.goto("/");

			const homeLink = page.locator('nav a[href="/"]');
			await expect(homeLink).toHaveAttribute("aria-current", "page");

			// Navigate to another page
			await page.goto("/about");
			const aboutLink = page.locator('nav a[href="/about"]');
			await expect(aboutLink).toHaveAttribute("aria-current", "page");
		});
	});

	test.describe("Data Display Components", () => {
		test("should render job match cards correctly", async ({ page }) => {
			await page.goto("/matches"); // This would need mock data

			const matchCard = page.locator('[data-testid="match-card"]').first();

			// Check required elements are present
			await expect(matchCard.locator('[data-testid="job-title"]')).toBeVisible();
			await expect(matchCard.locator('[data-testid="company-name"]')).toBeVisible();
			await expect(matchCard.locator('[data-testid="match-score"]')).toBeVisible();
		});

		test("should handle empty states", async ({ page }) => {
			await page.goto("/matches?empty=true"); // Mock empty state

			await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
			await expect(page.locator('[data-testid="empty-state-message"]')).toContainText("No matches found");
		});
	});

	test.describe("Loading and Error States", () => {
		test("should show skeleton loading", async ({ page }) => {
			await page.goto("/matches?loading=true"); // Mock loading state

			const skeleton = page.locator('[data-testid="skeleton-loader"]');
			await expect(skeleton).toBeVisible();

			// Skeleton should disappear after loading
			await page.waitForSelector('[data-testid="match-card"]', { timeout: 5000 });
			await expect(skeleton).not.toBeVisible();
		});

		test("should handle error states gracefully", async ({ page }) => {
			await page.goto("/matches?error=true"); // Mock error state

			await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
			await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
		});
	});

	test.describe("Accessibility", () => {
		test("should have proper ARIA labels", async ({ page }) => {
			await page.goto("/components/form");

			const emailInput = page.locator('input[type="email"]');
			await expect(emailInput).toHaveAttribute("aria-label");

			const submitButton = page.locator('button[type="submit"]');
			await expect(submitButton).toHaveAttribute("aria-label");
		});

		test("should support keyboard navigation", async ({ page }) => {
			await page.goto("/components/form");

			// Tab through form elements
			await page.keyboard.press("Tab");
			let focusedElement = page.locator(":focus");
			await expect(focusedElement).toHaveAttribute("type", "email");

			await page.keyboard.press("Tab");
			focusedElement = page.locator(":focus");
			await expect(focusedElement).toHaveAttribute("type", "password");
		});
	});
});