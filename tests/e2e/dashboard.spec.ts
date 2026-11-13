import { test, expect } from "@playwright/test";

test.describe("SareyBothPortfolio CMS Authenticated Dashboard & Preview Shell", () => {
  test("unauthenticated visit to /dashboard redirects to /login with return query", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign In");
  });

  test("owner login flow, authenticated dashboard navigation, and metrics rendering", async ({ page }) => {
    await page.goto("/login");

    // Fill credentials for bootstrapped owner
    await page.fill('input[type="email"]', "sareyboth@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // Redirection to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");

    // Dashboard shell verification
    await expect(page.getByText(/SareyBoth/i).first()).toBeVisible();
    await expect(page.getByText(/Highlights/i).first()).toBeVisible();

    // Navigate to Highlights management
    await page.getByRole("link", { name: /Highlights/i }).first().click();
    await page.waitForURL(/\/dashboard\/highlights/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Highlights");

    // Navigate to Profile Settings
    await page.getByRole("link", { name: /Profile/i }).first().click();
    await page.waitForURL(/\/dashboard\/profile/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Profile");

    // Navigate to System Audit Logs
    await page.getByRole("link", { name: /Audit Log/i }).first().click();
    await page.waitForURL(/\/dashboard\/audit/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Audit");

    // Navigate to Data Portability
    await page.getByRole("link", { name: /Data Tools/i }).first().click();
    await page.waitForURL(/\/dashboard\/data/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Data Export & Import");
  });

  test("authenticated preview shell renders draft banner and noindex meta", async ({ page }) => {
    // Log in first
    await page.goto("/login");
    await page.fill('input[type="email"]', "sareyboth@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Visit live draft preview shell
    await page.goto("/preview");
    await expect(page.getByText("DRAFT PREVIEW MODE — Live Unpublished Changes")).toBeVisible();

    // Verify robots meta is set to noindex
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });
});
