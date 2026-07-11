import { test, expect } from "@playwright/test";

test.describe("Board Kanban", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(process.env.E2E_EMAIL ?? "demo@axiom.dev");
    await page.getByPlaceholder(/password/i).fill(process.env.E2E_PASSWORD ?? "Demo@Axiom123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/[a-z]/);
  });

  test("Board loads with columns", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await expect(page.locator("[data-column]").first()).toBeVisible({ timeout: 5000 });
  });

  test("Can create a task", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await page.getByRole("button", { name: /add task|new task|\+/i }).first().click();
    await page.getByPlaceholder(/task title|title/i).fill("E2E Test Task");
    await page.getByRole("button", { name: /create|save|add/i }).click();

    await expect(page.locator("text=E2E Test Task")).toBeVisible({ timeout: 3000 });
  });

  test("Command palette opens with Ctrl+K", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/search tasks/i)).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder(/search tasks/i)).not.toBeVisible();
  });

  test("Keyboard shortcuts panel opens with ?", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await page.keyboard.press("?");
    await expect(page.locator("text=Keyboard Shortcuts")).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Escape");
  });
});
