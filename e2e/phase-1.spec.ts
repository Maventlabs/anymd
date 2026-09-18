import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("Fase 1 landing preserves the idea-to-clarification journey", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Big idea. Clear beginning." }),
  ).toBeVisible();
  await expect(page.locator("main > section")).toHaveCount(10);
  await expect(page.getByText(/Fase 1 interface/)).toBeVisible();

  const sections = page.locator("main > section");
  for (let index = 0; index < 10; index += 1) {
    const section = sections.nth(index);
    await expect(section).toHaveClass(index % 2 === 0 ? /band-white/ : /band-blue/);
  }

  await expect(
    page.getByRole("img", {
      name: /Placeholder for an AnyMD-generated Client portal website preview/,
    }).first(),
  ).toBeVisible();

  const advanced = page.locator(".stack-picker > summary");
  await advanced.click();
  await expect(page.getByText("Tech preferences")).toBeVisible();
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
  await page.getByRole("button", { name: "Close tech preferences" }).click();
  await expect(page.getByText("Tech preferences")).toBeHidden();

  await page.getByLabel("Describe your product idea").fill(
    "A focused workspace that helps independent studios turn client feedback into clear product decisions.",
  );
  await page.getByRole("button", { name: "Shape my idea" }).click();
  await expect(page).toHaveURL(/\/clarify$/);
  await expect(page.getByText("02 / Clarification")).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Big idea. Clear beginning." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("fase-1-landing.png"),
    fullPage: true,
  });
});
