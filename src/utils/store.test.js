import { describe, it, expect } from "vitest";
import useAppStore from "./store.js";
import { DELIVERABLE_TYPES } from "./workflowEngine.js";

// jsdom env provides localStorage

describe("store helpers", () => {
  it("auto-selects profile from owner name", () => {
    const { setJobOwnerAutoProfile } = useAppStore.getState();
    setJobOwnerAutoProfile("Mon Power - FirstEnergy");
    expect(useAppStore.getState().currentSubmissionProfile).toBe("firstEnergy");
  });

  it("recommends attach height respecting road clearance", () => {
    const { recommendAttachHeight } = useAppStore.getState();
    const r = recommendAttachHeight(14, "road");
    expect(r).toHaveProperty("recommendedFt");
    expect(r.recommendedFt).toBeGreaterThanOrEqual(r.targetFt);
  });

  it("does not rewrite workflowRequirements when unchanged", () => {
    useAppStore.getState().reset();
    const { updateWorkflowRequirements, setSelectedDeliverables } =
      useAppStore.getState();
    setSelectedDeliverables([DELIVERABLE_TYPES.GIS_EXPORT]);
    updateWorkflowRequirements();
    const first = useAppStore.getState().workflowRequirements;
    updateWorkflowRequirements();
    const second = useAppStore.getState().workflowRequirements;
    expect(second).toBe(first);
  });
});
