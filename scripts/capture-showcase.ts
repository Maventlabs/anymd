import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Page } from "@playwright/test";

const baseUrl = process.env.SHOWCASE_BASE_URL ?? "http://127.0.0.1:3011";
const output = resolve("public/showcase");
mkdirSync(output, { recursive: true });

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);
}

async function capture(page: Page, name: string) {
  await settle(page);
  await page.screenshot({
    path: resolve(output, name),
    type: "jpeg",
    quality: 84,
    fullPage: false,
  });
}

async function main() {
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });

  await page.goto(baseUrl);
  const declineAnalytics = page.getByRole("button", { name: "Tidak sekarang" });
  if (await declineAnalytics.isVisible().catch(() => false)) {
    await declineAnalytics.click();
  }
  await page.getByLabel("Describe your product idea").fill(
    "A workspace that helps independent studios turn client feedback into clear product decisions.",
  );
  await page.getByRole("button", { name: "Continue to clarification" }).click();
  await page.waitForURL(/\/clarify$/);
  await page.locator(".clarify-stage").waitFor({ state: "visible" });
  await capture(page, "clarify-intake.jpg");

  let capturedTheme = false;
  for (let step = 0; step < 24; step += 1) {
    if (
      await page
        .getByRole("heading", { name: "Review your brief." })
        .isVisible()
        .catch(() => false)
    ) {
      break;
    }

    const themeHeading = page.getByRole("heading", {
      name: "Which visual direction fits the product?",
    });
    if (await themeHeading.isVisible().catch(() => false)) {
      if (!capturedTheme) {
        await capture(page, "theme-selection.jpg");
        capturedTheme = true;
      }
      await page.getByRole("radio", { name: /Signal Black/ }).click();
    } else if (
      await page
        .getByRole("heading", {
          name: /Here is a considered starting stack\.|Choose the tools behind it\./,
        })
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByRole("button", { name: "Continue to questions" }).click();
      continue;
    } else {
      const radio = page.getByRole("radio").first();
      if (await radio.isVisible().catch(() => false)) {
        await radio.click();
      } else {
        const answer = page.locator(".clarify-stage textarea");
        if (await answer.isVisible().catch(() => false)) {
          await answer.fill("A concrete answer for the product brief.");
        }
      }
    }

    const reviewAnswers = page.getByRole("button", {
      name: "Review answers",
      exact: true,
    });
    if (await reviewAnswers.isVisible().catch(() => false)) {
      await reviewAnswers.click();
    } else {
      await page.getByRole("button", { name: "Next", exact: true }).click();
    }
  }

  await page.getByRole("button", { name: "Review recommended skills" }).click();
  await page.waitForURL(/\/skills$/);
  await page.getByRole("heading", { name: "Recommended for this build." }).waitFor();
  await capture(page, "skills-review.jpg");

  await page.goto(`${baseUrl}/pricing`);
  await page.locator(".pricing-grid").waitFor({ state: "visible" });
  await capture(page, "pricing.jpg");
} finally {
  await browser.close();
}
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
