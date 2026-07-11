import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test-${Date.now()}@axiom-e2e.dev`;
const TEST_PASSWORD = "Axiom@Test123!";
const TEST_NAME = "E2E Tester";

test.describe("Authentication", () => {
  test("User can sign up with credentials", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder(/name/i).fill(TEST_NAME);
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/(workspaces\/new|[a-z])/);
  });

  test("User can log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page).not.toHaveURL("/login");
  });

  test("Invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("wrong@example.com");
    await page.getByPlaceholder(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page.locator("text=/error|invalid|incorrect/i")).toBeVisible();
  });
});
