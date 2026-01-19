import { expect, test } from "@playwright/test";

test("basic homepage", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("body")).toBeVisible();
});
