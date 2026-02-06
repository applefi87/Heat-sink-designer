import { test, expect } from "@playwright/test";

test("wizard flow", async ({ page }) => {
  await page.goto("/wizard");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Go to results" }).click();

  await expect(page.getByText("Results Summary")).toBeVisible();
  await expect(page.locator("text=Operating Point Chart")).toBeVisible();

  await page.getByRole("button", { name: "Run 1D sweep" }).click();
  await expect(page.locator(".chart")).toBeVisible();

  await page.getByText("Show formulas").first().click();
  await expect(page.locator(".katex")).toBeVisible();

  await page.getByRole("button", { name: "Run 2D sweep" }).click();
  await expect(page.getByRole("progressbar")).toBeVisible();
});
