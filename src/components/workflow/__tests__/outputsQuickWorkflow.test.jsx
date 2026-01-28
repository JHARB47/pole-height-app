// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OutputsPanel from "../panels/OutputsPanel.jsx";
import useAppStore from "../../../utils/store.js";
import { DELIVERABLE_TYPES } from "../../../utils/workflowEngine.js";

vi.mock("../../../utils/exporters", () => ({
  buildPolesCSV: () => "csv",
  buildSpansCSV: () => "csv",
  buildExistingLinesCSV: () => "csv",
  buildGeoJSON: () => "geojson",
  buildKML: () => "kml",
}));

describe("OutputsPanel quick workflow", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.getState().setWorkflowMode("flex");
    useAppStore
      .getState()
      .setSelectedDeliverables([
        DELIVERABLE_TYPES.GIS_EXPORT,
        DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
      ]);
    useAppStore.getState().setCollectedPoles([
      {
        id: "pole-1",
        latitude: 40.1,
        longitude: -80.2,
      },
    ]);
    useAppStore.getState().setCurrentJobId("job-1");
    useAppStore.getState().setProjectName("Quick Workflow");

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        element.click = vi.fn();
      }
      return element;
    });

    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows export when quick workflow inputs are sufficient", async () => {
    const toast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    render(<OutputsPanel toast={toast} />);

    fireEvent.click(screen.getByTestId("export-button-geojson"));

    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalled();
    });

    expect(screen.queryByTestId("preflight-panel")).toBeNull();
  });
});
