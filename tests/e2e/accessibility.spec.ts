import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage accessibility audit', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        console.log(`   Elements: ${violation.nodes.length}`);
        console.log('');
      });
    }

    // Assert no critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);

    // Allow some minor violations but keep total low
    expect(accessibilityScanResults.violations.length).toBeLessThan(10);
  });

  test('Signup page accessibility', async ({ page }) => {
    await page.goto('/signup/free');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Check form-specific accessibility
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check for proper labels
    const inputs = page.locator('input[required]');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const label = page.locator(`label[for="${await input.getAttribute('id')}"]`);

      // Either aria-label, aria-labelledby, or associated label should exist
      const hasAccessibilityLabel = ariaLabel || ariaLabelledBy || (await label.count() > 0);
      expect(hasAccessibilityLabel).toBe(true);
    }

    // Assert no critical form violations
    const formViolations = accessibilityScanResults.violations.filter(
      v => v.nodes.some(node => node.target.join('').includes('form'))
    );

    const criticalFormViolations = formViolations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalFormViolations.length).toBe(0);
  });

  test('Navigation accessibility', async ({ page }) => {
    await page.goto('/');

    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test main navigation links
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();

    expect(linkCount).toBeGreaterThan(0);

    // Verify each link has accessible text
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      expect(text?.trim() || ariaLabel?.trim()).toBeTruthy();
    }
  });

  test('Color contrast compliance', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    // Log contrast issues
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log('Color contrast violations:');
      contrastViolations.forEach(violation => {
        console.log(`- ${violation.description}`);
      });
    }

    // Allow some contrast violations for branded elements, but keep total low
    expect(contrastViolations.length).toBeLessThan(5);
  });
});