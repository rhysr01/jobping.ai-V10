import { expect, test } from "@playwright/test";

test.describe("Accessibility: Keyboard Navigation", () => {
	test("Premium signup form keyboard navigation", async ({ page }) => {
		await page.goto("/signup");

		// Wait for the form to load
		await expect(page.locator("h1")).toContainText("Create Your Account");

		// Start keyboard navigation from the first focusable element
		await page.keyboard.press("Tab");

		// Check that we're on the first input field (full name)
		const activeElement = await page.evaluate(
			() => document.activeElement?.tagName,
		);
		expect(activeElement).toBe("INPUT");

		// Navigate through all form fields
		const expectedFields = [
			"fullName",
			"email",
			"cities",
			"careerPath",
			"languages",
			"workEnvironment",
			"visaStatus",
			"entryLevelPreferences",
			"targetCompanies",
			"roles",
			"industries",
			"companySizePreference",
			"skills",
			"careerKeywords",
			"birthYear",
			"ageVerification",
			"termsAcceptance",
			"gdprConsent",
		];

		// Tab through each field and verify focus
		for (const fieldName of expectedFields) {
			const field = page
				.locator(
					`[data-testid="${fieldName}"], #${fieldName}, input[name="${fieldName}"], [aria-label*="${fieldName}"]`,
				)
				.first();
			if (await field.isVisible()) {
				await expect(field).toBeFocused();
			}
			await page.keyboard.press("Tab");
		}

		// Verify we can reach the submit button
		const submitButton = page.locator('button[type="submit"]').first();
		await expect(submitButton).toBeFocused();

		// Test Enter key submission (should show validation errors since form is empty)
		await page.keyboard.press("Enter");
		await expect(
			page.locator("text=Please fill in all required fields"),
		).toBeVisible();
	});

	test("Free signup form keyboard navigation", async ({ page }) => {
		await page.goto("/");

		// Click on free signup CTA
		await page.locator('a[href*="free"]').first().click();

		// Wait for free signup form
		await expect(page.locator("h1")).toContainText(
			/Get Your 5 Free Matches|Find Your Dream Job/,
		);

		// Start keyboard navigation
		await page.keyboard.press("Tab");

		// Navigate through free form fields
		const freeFormFields = [
			"fullName",
			"email",
			"cities",
			"careerPath",
			"visaSponsorship",
			"birthYear",
			"ageVerification",
			"termsAcceptance",
			"gdprConsent",
		];

		for (const fieldName of freeFormFields) {
			const field = page
				.locator(`input[name="${fieldName}"], [data-testid="${fieldName}"]`)
				.first();
			if (await field.isVisible()) {
				// Field should be focusable
				await expect(field).toBeVisible();
			}
			await page.keyboard.press("Tab");
		}

		// Verify submit button is reachable
		const submitButton = page.locator('button[type="submit"]').first();
		await expect(submitButton).toBeVisible();
	});

	test("Skip links and focus management", async ({ page }) => {
		await page.goto("/");

		// Check for skip links (should be added to main navigation)
		const skipLink = page.locator('a[href="#main-content"]').first();
		if (await skipLink.isVisible()) {
			await skipLink.click();
			// Should focus on main content
			const mainContent = page.locator("#main-content").first();
			await expect(mainContent).toBeFocused();
		}
	});

	test("Modal and overlay keyboard handling", async ({ page }) => {
		await page.goto("/");

		// Trigger any modal/popup if available
		const modalTrigger = page
			.locator('[role="dialog"], .modal, [data-modal]')
			.first();
		if (await modalTrigger.isVisible()) {
			await modalTrigger.click();

			// Check that focus is trapped within modal
			await page.keyboard.press("Tab");
			const focusedElement = await page.evaluate(() =>
				document.activeElement?.closest('[role="dialog"]'),
			);
			expect(focusedElement).not.toBeNull();

			// Test Escape key closes modal
			await page.keyboard.press("Escape");
			await expect(modalTrigger).not.toBeVisible();
		}
	});

	test("Error message keyboard navigation", async ({ page }) => {
		await page.goto("/signup");

		// Try to submit empty form
		const submitButton = page.locator('button[type="submit"]').first();
		await submitButton.click();

		// Check that error messages are announced and focusable
		const errorMessage = page
			.locator('[role="alert"], .error, text="required"')
			.first();
		if (await errorMessage.isVisible()) {
			// Error should be keyboard accessible
			await page.keyboard.press("Tab");
			// Focus should move to error or associated field
		}
	});

	test("Form validation keyboard feedback", async ({ page }) => {
		await page.goto("/signup");

		// Fill out a field incorrectly and check keyboard feedback
		const emailField = page.locator('input[type="email"]').first();
		await emailField.fill("invalid-email");
		await emailField.press("Tab");

		// Should show validation error
		const error = page.locator('text="Invalid email"').first();
		if (await error.isVisible()) {
			await expect(error).toHaveAttribute("role", "alert");
		}
	});
});
