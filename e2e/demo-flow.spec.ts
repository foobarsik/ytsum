import { test, expect } from "@playwright/test";
test("research demo flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Add playlist" }).first().click();
  await page.getByLabel("Research").check();
  await page.getByRole("button", { name: "Import playlist" }).click();
  await expect(page.getByText("The sources converge on constrained")).toBeVisible();
  await page.getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByText("Analysis complete")).toBeVisible();
  await page.getByRole("link", { name: /Why Most AI Agents Fail/ }).click();
  await expect(page.getByRole("heading", { name: "Summary" })).toBeVisible();
});
