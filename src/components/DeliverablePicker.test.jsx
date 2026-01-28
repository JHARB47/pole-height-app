// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import DeliverablePicker from "./DeliverablePicker.jsx";
import useAppStore from "../utils/store.js";
import { DELIVERABLE_TYPES } from "../utils/workflowEngine.js";

describe("DeliverablePicker", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("applies quick workflow preset with flex mode", () => {
    render(<DeliverablePicker />);

    fireEvent.click(screen.getByTestId("deliverable-quick-workflow"));

    const state = useAppStore.getState();
    expect(state.workflowMode).toBe("flex");
    expect(state.selectedDeliverables).toEqual([
      DELIVERABLE_TYPES.GIS_EXPORT,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    ]);
  });
});
