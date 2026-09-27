import { expect, test } from "@playwright/test";

test("signed-out navbar shows login and signup without the start CTA", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const header = page.locator(".site-header");
  await expect(header.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Log out" })).toHaveCount(0);
  await expect(
    header.getByRole("link", { name: "Start with an idea" }),
  ).toHaveCount(0);
  await expect(page.locator(".site-header .wordmark-image")).toBeVisible();
  if (testInfo.project.name === "desktop-chromium") {
    await page.screenshot({
      path: "artifacts/navbar-desktop.png",
      fullPage: false,
    });
  }
});

test("mobile navbar keeps section links visible and opens the full menu", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const visibleNavigation = page.locator(".site-nav-links a:visible");
  await expect(visibleNavigation).toHaveCount(3);
  await expect(visibleNavigation.nth(0)).toHaveText("Features");
  await expect(visibleNavigation.nth(1)).toHaveText("FAQ");
  await expect(visibleNavigation.nth(2)).toHaveText("Output");
  await expect(page.locator(".site-header .wordmark-image")).toBeVisible();
  const glassStyles = await page.locator(".site-header-inner").evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    backdrop: getComputedStyle(element).backdropFilter,
    headerBackground: getComputedStyle(element.closest(".site-header")!).backgroundColor,
  }));
  expect(glassStyles.background).toContain("0.56");
  expect(glassStyles.backdrop).toContain("blur");
  expect(glassStyles.headerBackground).toBe("rgba(0, 0, 0, 0)");

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const mobileLayout = await page.evaluate(() => {
      const bounds = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect();
      const logo = bounds(".site-header .wordmark");
      const links = bounds(".site-nav-links");
      const menuButton = bounds(".site-mobile-toggle");
      const firstTwo = Array.from(document.querySelectorAll(".site-nav-links a"))
        .slice(0, 2)
        .map((link) => link.getBoundingClientRect());
      return {
        ordered: logo.left < links.left && links.left < menuButton.left,
        firstTwoFit: firstTwo.every(
          (link) => link.left >= links.left && link.right <= links.right,
        ),
      };
    });
    expect(mobileLayout.ordered).toBe(true);
    expect(mobileLayout.firstTwoFit).toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  if (testInfo.project.name === "mobile-chromium") {
    await page.screenshot({
      path: "artifacts/navbar-mobile.png",
      fullPage: false,
    });
  }

  const menuToggle = page.getByRole("button", { name: "Open navigation menu" });
  await menuToggle.click();
  await expect(
    page.getByRole("button", { name: "Close navigation menu" }),
  ).toHaveAttribute("aria-expanded", "true");

  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  for (const label of ["Approach", "Visual", "Pricing"]) {
    await expect(menu.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(menu.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(
    menu.getByRole("link", { name: "Start with an idea" }),
  ).toHaveCount(0);
  if (testInfo.project.name === "mobile-chromium") {
    await page.screenshot({
      path: "artifacts/navbar-mobile-open.png",
      fullPage: false,
    });
  }
});
