import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
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

  test("password reset page loads", async ({ page }) => {
    await page.goto("/request-password-reset");
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe("unauthenticated dashboard redirects", () => {
  const dashboardRoutes = [
    "/dashboard/agents",
    "/dashboard/contacts",
    "/dashboard/prompts",
    "/dashboard/agent-chat",
    "/dashboard/vector-stores",
    "/dashboard/groups",
    "/dashboard/credentials",
    "/dashboard/email-templates",
    "/dashboard/settings/account",
    "/dashboard/settings/api-keys",
  ];

  for (const route of dashboardRoutes) {
    test(`${route} redirects to home`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL("/");
    });
  }
});
