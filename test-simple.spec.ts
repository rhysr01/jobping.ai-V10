import { test, expect } from "@playwright/test"; test("basic homepage", async ({ page }) => { await page.goto("/"); await expect(page.locator("body")).toBeVisible(); });
