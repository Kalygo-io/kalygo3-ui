import { test, expect } from "@playwright/test";

test.describe("smoke tests", () => {
  test("landing page loads and has core navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Kalygo/i);
    await expect(page.getByRole("navigation").getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /get started/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("unauthenticated dashboard access redirects to home", async ({ page }) => {
    await page.goto("/dashboard/agents");
    await page.waitForURL("/");
  });
});
