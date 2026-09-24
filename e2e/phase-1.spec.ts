import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("landing preserves the idea-to-clarification journey", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Turn product ideas into build-ready briefs.",
    }),
  ).toBeVisible();
  await expect(page.locator("main > section")).toHaveCount(10);
  await expect(
    page.getByRole("heading", { name: "Generate when your brief is ready." }),
  ).toBeVisible();
  await expect(page.locator(".pricing-card")).toHaveCount(3);
  await expect(
    page.locator(".prototype-note"),
  ).toBeVisible();

  const sections = page.locator("main > section");
  const expectedBands = [
    "band-white",
    "band-blue",
    "band-white",
    "band-blue",
    "band-white",
    "band-white",
    "band-blue",
    "band-white",
    "band-blue",
    "band-white",
  ];
  for (let index = 0; index < 10; index += 1) {
    await expect(sections.nth(index)).toHaveClass(
      new RegExp(expectedBands[index]),
    );
  }

  await expect(
    page.getByRole("img", {
      name: /Illustrative Client portal product concept/,
    }).first(),
  ).toBeVisible();

  await page.getByLabel("Describe your product idea").fill(
    "A focused workspace that helps independent studios turn client feedback into clear product decisions.",
  );
  await page.getByRole("button", { name: "Continue to clarification" }).click();
  await expect(page).toHaveURL(/\/clarify$/);
  await expect(page.getByText("02 / Clarify the brief")).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Turn product ideas into build-ready briefs.",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("fase-1-landing.png"),
    fullPage: true,
  });
});

test("draft survives a browser refresh", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const idea =
    "A focused workspace that helps independent studios turn client feedback into clear product decisions.";
  await page.getByLabel("Describe your product idea").fill(idea);
  await page.getByRole("button", { name: "Continue to clarification" }).click();
  await expect(page).toHaveURL(/\/clarify$/);

  await page.reload();
  await page.goto("/");
  await expect(page.getByLabel("Describe your product idea")).toHaveValue(idea);
});
