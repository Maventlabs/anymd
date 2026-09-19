import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("Phase 3 chooses a theme and recommends skills automatically", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByLabel("Describe your product idea")
    .fill(
      "A workspace that helps independent studios turn client feedback into clear product decisions.",
    );
  const shapeIdea = page.getByRole("button", { name: "Continue to clarification" });
  await expect(shapeIdea).toBeEnabled();
  await shapeIdea.click();
  await expect(page).toHaveURL(/\/clarify$/, { timeout: 15_000 });

  for (let step = 0; step < 12; step += 1) {
    if (
      await page
        .getByRole("heading", { name: "Review your brief." })
        .isVisible()
        .catch(() => false)
    )
      break;
    const themeHeading = page.getByRole("heading", {
      name: "Which visual direction fits the product?",
    });
    if (await themeHeading.isVisible().catch(() => false)) {
      await expect(page.locator(".theme-card")).toHaveCount(6);
      await page.getByRole("radio", { name: /Signal Black/ }).click();
    } else {
      const radio = page.getByRole("radio").first();
      if (await radio.isVisible().catch(() => false)) await radio.click();
      else {
        const answer = page.locator(".clarify-stage textarea");
        if (await answer.isVisible())
          await answer.fill(
            "A concrete answer with enough detail for the product brief.",
          );
      }
    }
    const reviewAnswers = page.getByRole("button", {
      name: "Review answers",
      exact: true,
    });
    if (await reviewAnswers.isVisible().catch(() => false))
      await reviewAnswers.click();
    else
      await page
        .getByRole("button", { name: "Next", exact: true })
        .click();
  }

  await expect(
    page.getByRole("heading", { name: "Review your brief." }),
  ).toBeVisible();
  await expect(page.getByText("Signal Black", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review recommended skills" }).click();
  await expect(page).toHaveURL(/\/skills$/);
  await expect(
    page.getByRole("heading", { name: "Recommended for this build." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with recommendations" }),
  ).toBeEnabled();

  for (const category of ["Architecture & Code Quality", "UI/UX & Design System"]) {
    await expect(page.getByRole("group", { name: category })).toBeVisible();
  }

  await expect(page.getByText("Planning and Task Breakdown", { exact: true })).toBeVisible();
  await expect(page.getByText("Frontend Design", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);

  await page.getByRole("button", { name: "Back to review" }).click();
  await expect(page).toHaveURL(/\/clarify$/);
  await page.getByRole("button", { name: "Review recommended skills" }).click();
  await expect(page.getByText("Frontend Design", { exact: true })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("phase-3-skills.png"),
    fullPage: true,
  });

  await page
    .getByRole("button", { name: "Continue with recommendations" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recommendations saved for this tab." }),
  ).toBeVisible();
});

test("direct skill selection without a draft shows the empty state", async ({
  page,
}) => {
  await page.goto("/skills");
  await expect(
    page.getByRole("heading", { name: "Start with your product idea first." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Describe your idea" })).toBeVisible();
});
