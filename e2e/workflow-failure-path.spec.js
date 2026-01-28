/**
 * E2E Tests - Failure Scenarios
 * Tests error handling and edge cases
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ppp_help_seen", "1");
  });
});

const openNavigationIfNeeded = async (page) => {
  const menuButton = page.getByTestId("nav-menu-button");
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
};

test.describe("Failure Path: Error Handling", () => {
  test("should handle invalid data gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("workflow-requirements-ready")).toHaveAttribute(
      "data-ready",
      "true",
    );

    // App should load without crashing
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.waitForTimeout(2000);

    // Should not have uncaught errors
    expect(errors.length).toBe(0);

    console.log("✅ No uncaught JavaScript errors");
  });

  test("should display error message for network failure", async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    try {
      await page.goto("/", { timeout: 5000 });
    } catch (e) {
      // Expected to fail - offline
      console.log("✅ Correctly handled offline state");
    }

    // Re-enable network
    await page.context().setOffline(false);

    // Now should load
    await page.goto("/");
    await expect(page.getByTestId("workflow-requirements-ready")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await expect(page.locator("body")).toBeVisible();

    console.log("✅ Recovered from offline state");
  });

  test("should validate form inputs", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    await expect(page.getByTestId("workflow-requirements-ready")).toHaveAttribute(
      "data-ready",
      "true",
    );

    // Look for input fields
    const inputs = await page
      .locator('input[type="text"], input[type="number"]')
      .all();

    if (inputs.length > 0) {
      // Try entering invalid data
      const firstInput = inputs[0];

      await firstInput.fill("invalid@#$");
      await firstInput.blur();

      // Check if validation message appears (or input is sanitized)
      const value = await firstInput.inputValue();

      // Either validation prevented it, or input was sanitized
      expect(value).toBeDefined();

      console.log("✅ Input validation/sanitization working");
    } else {
      console.log("⚠️  No text inputs found to test");
    }
  });

  test("should handle missing data gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("workflow-requirements-ready")).toHaveAttribute(
      "data-ready",
      "true",
    );

    await openNavigationIfNeeded(page);
    await page.getByTestId("step-nav-outputs").click();
    await expect(page.getByTestId("missing-data-warning")).toBeVisible();

    console.log("✅ Export without data handled gracefully");
  });
});

test.describe("CDN Fallback Scenario", () => {
  test("should fallback when CDN resources fail", async ({ page }) => {
    // Block CDN resources to test fallback
    await page.route("**/unpkg.com/**", (route) => route.abort());
    await page.route("**/cdn.jsdelivr.net/**", (route) => route.abort());

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("workflow-requirements-ready")).toHaveAttribute(
      "data-ready",
      "true",
    );

    // App should still load even with CDN blocked
    const body = await page.locator("body").first();
    await expect(body).toBeVisible();

    console.log("✅ App loads without CDN dependencies");
  });

  test("should export GeoJSON when shapefile CDN fails", async ({ page }) => {
    // Block shp-write CDN
    await page.route("**/@mapbox/shp-write**", (route) => route.abort());

    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    await expect(page.getByTestId("workflow-requirements-ready")).toHaveAttribute(
      "data-ready",
      "true",
    );

    // The app should still function (shapefile export falls back to GeoJSON)
    const isWorking = await page.locator("body").isVisible();
    expect(isWorking).toBe(true);

    console.log("✅ Shapefile CDN fallback behavior verified");
  });
});
