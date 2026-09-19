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
  await expect(page.locator("main > section")).toHaveCount(11);
  await expect(
    page.getByRole("heading", { name: "Generate when your brief is ready." }),
  ).toBeVisible();
  await expect(page.locator(".pricing-card")).toHaveCount(3);
  await expect(
    page.locator(".prototype-note"),
  ).toBeVisible();

  const sections = page.locator("main > section");
  for (let index = 0; index < 10; index += 1) {
    const section = sections.nth(index);
    await expect(section).toHaveClass(index % 2 === 0 ? /band-white/ : /band-blue/);
  }

  await expect(
    page.getByRole("img", {
      name: /Illustrative Client portal product concept/,
    }).first(),
  ).toBeVisible();

  const advanced = page.locator(".stack-picker > summary");
  await advanced.click();
  await expect(page.locator(".stack-panel-heading strong")).toBeVisible();
  for (const category of [
    "Frontend",
    "Backend",
    "Database",
    "Auth",
    "Payments",
    "Hosting",
  ]) {
    await expect(page.getByRole("group", { name: category })).toBeVisible();
  }
  await page.getByRole("button", { name: "Next.js", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Next.js", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close stack preferences" }).click();
  await expect(page.locator(".stack-panel-heading strong")).toBeHidden();

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
