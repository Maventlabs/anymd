import { expect, test, type Page } from "@playwright/test";

test.setTimeout(60_000);

async function startClarification(page: Page) {
  await page.goto("/");
  await page.evaluate(() => indexedDB.deleteDatabase("anymd-draft"));
  await page.reload();
  await page.getByLabel("Describe your product idea").fill(
    "A workspace that helps independent studios turn client feedback into clear product decisions.",
  );
  await page.getByRole("button", { name: "Continue to clarification" }).click();
  await expect(page).toHaveURL(/\/clarify$/);
}

test("automatic stack recommendations show the full icon-backed catalog", async ({
  page,
}) => {
  await startClarification(page);
  await page.getByRole("radio", { name: "Web App" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: "MVP" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: "Automatic recommendation" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Here is a considered starting stack." })).toBeVisible();
  await expect(page.locator(".stack-option")).toHaveCount(72);
  await expect(page.locator(".stack-option-icon")).toHaveCount(72);
  await expect(page.locator('.stack-option[aria-pressed="true"]')).toHaveCount(6);
});

test("manual stack selection clears recommendations and requires every category", async ({
  page,
}) => {
  await startClarification(page);
  await page.getByRole("radio", { name: "Web App" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: "MVP" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: "Manual selection" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.locator('.stack-option[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to questions" }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "Choose one option for each stack category before continuing.",
  );
});
