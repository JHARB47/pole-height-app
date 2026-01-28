/**
 * E2E Tests - Deliverable-based workflow
 */
import { test, expect } from "@playwright/test";

const seedStore = (state) =>
  JSON.stringify({
    state,
    version: 0,
  });

const openNavigationIfNeeded = async (page) => {
  const menuButton = page.getByTestId("nav-menu-button");
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
};

test.describe("Deliverable-based workflow", () => {
  test("GIS-only workflow shows optional steps and preflight blocks export", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const seeded = JSON.stringify({
        state: {
          currentSubmissionProfile: "firstEnergy",
          submissionProfiles: [],
          existingLines: [],
          collectedPoles: [{ id: "pole-1" }],
          importedSpans: [],
          jobs: [
            {
              id: "job-1",
              name: "GIS Test",
              applicantName: "",
              jobNumber: "",
              presetProfile: "",
              jobOwner: "",
              notes: "",
              createdAt: new Date().toISOString(),
            },
          ],
          currentJobId: "job-1",
          projectName: "GIS Test",
          selectedDeliverables: ["gis_export"],
          workflowRequirements: null,
        },
        version: 0,
      });
      localStorage.setItem("pole-height-store", seeded);
      localStorage.setItem("ppp_help_seen", "1");
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByTestId("workflow-requirements-ready"),
    ).toHaveAttribute("data-ready", "true");

    await openNavigationIfNeeded(page);
    await page.getByTestId("step-nav-outputs").click();
    await page.getByTestId("export-button-geojson").click();

    await expect(page.getByTestId("preflight-panel")).toBeVisible();
    await expect(page.getByTestId("preflight-results")).toHaveAttribute(
      "data-ok",
      "false",
    );
    await expect(page.getByTestId("step-badge-optional").first()).toBeVisible();
  });

  test("Field collection only marks other steps optional", async ({ page }) => {
    await page.addInitScript(() => {
      const seeded = JSON.stringify({
        state: {
          currentSubmissionProfile: "firstEnergy",
          submissionProfiles: [],
          existingLines: [],
          collectedPoles: [],
          importedSpans: [],
          jobs: [
            {
              id: "job-2",
              name: "Field Only",
              applicantName: "",
              jobNumber: "",
              presetProfile: "",
              jobOwner: "",
              notes: "",
              createdAt: new Date().toISOString(),
            },
          ],
          currentJobId: "job-2",
          projectName: "Field Only",
          selectedDeliverables: ["field_collection"],
          workflowRequirements: null,
        },
        version: 0,
      });
      localStorage.setItem("pole-height-store", seeded);
      localStorage.setItem("ppp_help_seen", "1");
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByTestId("workflow-requirements-ready"),
    ).toHaveAttribute("data-ready", "true");

    await expect(page.getByTestId("step-badge-optional").first()).toBeVisible();
    await expect(page.getByTestId("step-badge-required").first()).toBeVisible();
  });
});
