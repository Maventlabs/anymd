import { expect, test } from "@playwright/test";

test.describe("email authentication", () => {
  test("signup, login, protected session, and logout work together", async ({
    page,
  }) => {
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

    const signoutRequest = page.waitForRequest("**/api/auth/signout");
    await page.locator("nav button").evaluate((button) => (button as HTMLElement).click());
    await signoutRequest;
  });
});
