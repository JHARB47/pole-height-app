// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAppStore from "../../../utils/store";
import JobSetupPanel from "../panels/JobSetupPanel";
import OutputsPanel from "../panels/OutputsPanel";
import { WorkflowApp } from "../WorkflowApp";
import { DELIVERABLE_TYPES } from "../../../utils/workflowEngine";

const createTestJob = () => {
  const { createJob, setCurrentJobId } = useAppStore.getState();
  const job = createJob("Test Job");
  setCurrentJobId(job.id);
  return job;
};

describe("Workflow integration", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("allows customizing deliverables from full workflow mode", () => {
    createTestJob();
    render(<JobSetupPanel />);

    const customizeButton = screen.getByText("Switch to Custom Selection");
    fireEvent.click(customizeButton);

    const gisCheckbox = screen.getByRole("checkbox", {
      name: /GIS Export/i,
    });
    fireEvent.click(gisCheckbox);

    const state = useAppStore.getState();
    expect(state.selectedDeliverables).not.toContain(
      DELIVERABLE_TYPES.GIS_EXPORT,
    );
  });

  it("renders required/optional badges based on deliverables", () => {
    useAppStore
      .getState()
      .setSelectedDeliverables([DELIVERABLE_TYPES.GIS_EXPORT]);
    render(<WorkflowApp />);

    const requiredBadges = screen.getAllByText("Required");
    const optionalBadges = screen.getAllByText("Optional");

    expect(requiredBadges.length).toBeGreaterThan(0);
    expect(optionalBadges.length).toBeGreaterThan(0);
  });

  it("shows recommended badges in flex mode", () => {
    const {
      setWorkflowMode,
      setSelectedDeliverables,
      updateWorkflowRequirements,
    } = useAppStore.getState();
    setWorkflowMode("flex");
    setSelectedDeliverables([DELIVERABLE_TYPES.GIS_EXPORT]);
    updateWorkflowRequirements();

    render(<WorkflowApp />);

    const recommendedBadges = screen.getAllByText("Recommended");
    expect(recommendedBadges.length).toBeGreaterThan(0);
  });

  it("blocks exports when preflight fails and shows diagnostics", () => {
    const { setCollectedPoles } = useAppStore.getState();
    useAppStore
      .getState()
      .setSelectedDeliverables([DELIVERABLE_TYPES.GIS_EXPORT]);
    setCollectedPoles([{ id: "pole-1" }]);

    const toast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    render(<OutputsPanel toast={toast} />);

    fireEvent.click(screen.getByText("GeoJSON"));

    expect(screen.getByText("Export Preflight Failed")).toBeTruthy();
    expect(toast.error).toHaveBeenCalled();
  });
});
