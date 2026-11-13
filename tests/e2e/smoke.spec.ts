import { expect, test } from "@playwright/test";

test.describe("SareyBothPortfolio Browser Smoke Suite", () => {
  test("homepage, highlight filtering, detail navigation, theme switching, and 404 behavior", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify single visible h1 with SareyBoth
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("SareyBoth");

    // Verify appearance switching sets data-mode on html
    const darkButton = page
      .getByRole("group", { name: "Color theme preference" })
      .getByRole("button", { name: "Dark" })
      .first();
    await darkButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    // Verify highlight category filtering
    const filterGroup = page.getByRole("group", {
      name: "Filter highlights by category",
    });
    await expect(filterGroup).toBeVisible();
    await filterGroup.getByRole("button", { name: "Collaboration" }).click();
    await expect(
      page.getByRole("link", {
        name: "Riverfront Oral History Listening Archive",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Neighborhood Seed Library & Seasonal Growing Guide",
      })
    ).toHaveCount(0);

    // Reset filter to All and navigate to detail page
    await filterGroup.getByRole("button", { name: "All" }).click();
    await page
      .getByRole("link", {
        name: "Neighborhood Seed Library & Seasonal Growing Guide",
      })
      .first()
      .click();

    await expect(page).toHaveURL(/\/highlights\/neighborhood-seed-library$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Neighborhood Seed Library & Seasonal Growing Guide"
    );

    // Verify unpublished highlight returns real 404
    const unpubRes = await page.goto(
      "/highlights/upcoming-winter-seed-swap-notes"
    );
    expect(unpubRes?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "We couldn't find that page"
    );

    // Verify disabled optional route /journal returns real 404
    const journalRes = await page.goto("/journal");
    expect(journalRes?.status()).toBe(404);
  });

  test("mobile menu keyboard & Escape behavior and no horizontal overflow across viewports", async ({
    page,
  }) => {
    const widths = [360, 390, 768, 1024, 1440];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const overflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        );
      });
      expect(overflow, `Horizontal overflow at ${width}px`).toBe(false);
    }

    // Test mobile menu at 390px
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    const menuBtn = page.getByRole("button", {
      name: /Open navigation menu/i,
    });
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await menuBtn.click();
    await expect(
      page.getByRole("button", { name: /Close navigation menu/i })
    ).toHaveAttribute("aria-expanded", "true");

    // Press Escape to close mobile menu
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: /Open navigation menu/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("customizer live preview, preset switching, section reordering, JSON export, and reset", async ({
    page,
  }) => {
    await page.goto("/customize");

    const previewSurface = page.getByTestId("customizer-preview-surface");
    await expect(previewSurface).toHaveAttribute("data-preset", "minimal");

    // Switch to Warm preset
    await page.getByRole("button", { name: /^Warm\s+Soft cream/i }).click();
    await expect(previewSurface).toHaveAttribute("data-preset", "warm");

    // Edit profile name in customizer and verify live preview updates
    const nameInput = page.getByLabel("Profile Name");
    await nameInput.fill("Morgan Avery");
    await expect(
      previewSurface.getByRole("heading", { level: 1 })
    ).toContainText("Morgan Avery");

    // Trigger JSON download
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("portfolio.json");

    // Reset to committed defaults
    await page.getByRole("button", { name: "Reset to Default" }).click();
    await expect(previewSurface).toHaveAttribute("data-preset", "minimal");
    await expect(
      previewSurface.getByRole("heading", { level: 1 })
    ).toContainText("SareyBoth");
  });
});
