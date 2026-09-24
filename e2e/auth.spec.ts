import { expect, test } from "@playwright/test";

test.describe("email authentication", () => {
  test.setTimeout(60_000);

  test("redirects anonymous users away from the profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?callbackUrl=.*profile/);
  });

  test("signup, login, protected session, and logout work together", async ({
    page,
  }) => {
    const projectOffset = test.info().project.name === "mobile-chromium" ? 40 : 0;
    const clientIp = `127.0.0.${10 + projectOffset + (Date.now() % 200)}`;
    await page.context().setExtraHTTPHeaders({
      "x-forwarded-for": clientIp,
    });
    const email = `playwright-${Date.now()}-${test.info().project.name}@example.com`;
    const password = "playwright-password";

    await page.goto("/signup");
    await page.getByLabel("Nama").fill("Playwright User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi").fill(password);
    const signupResponse = page.waitForResponse("**/api/auth/signup");
    await page.getByRole("button", { name: "Buat akun" }).click();
    const response = await signupResponse;
    expect(response.status()).toBe(201);
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.locator(".auth-error")).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText("Log out", { exact: true })).toHaveCount(1);
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Your account." })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });
});
