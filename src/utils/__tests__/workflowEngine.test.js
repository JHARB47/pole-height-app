/**
 * Unit tests for workflowEngine.js
 *
 * Tests deliverable-based workflow requirement calculation
 */

import { describe, it, expect } from "vitest";
import {
  getWorkflowRequirements,
  DELIVERABLE_TYPES,
  DELIVERABLE_METADATA,
} from "../workflowEngine.js";

describe("workflowEngine", () => {
  describe("DELIVERABLE_TYPES", () => {
    it("should define all deliverable type constants", () => {
      expect(DELIVERABLE_TYPES.GIS_EXPORT).toBe("gis_export");
      expect(DELIVERABLE_TYPES.PERMIT_REPORT).toBe("permit_report");
      expect(DELIVERABLE_TYPES.FIRSTENERGY_EXPORT).toBe("firstenergy_export");
      expect(DELIVERABLE_TYPES.FIELD_COLLECTION).toBe("field_collection");
      expect(DELIVERABLE_TYPES.CLEARANCE_ANALYSIS).toBe("clearance_analysis");
      expect(DELIVERABLE_TYPES.EXISTING_PLANT_DOC).toBe("existing_plant_doc");
    });
  });

  describe("DELIVERABLE_METADATA", () => {
    it("should have metadata for all deliverable types", () => {
      const types = Object.values(DELIVERABLE_TYPES);
      types.forEach((type) => {
        expect(DELIVERABLE_METADATA[type]).toBeDefined();
        expect(DELIVERABLE_METADATA[type].id).toBe(type);
        expect(DELIVERABLE_METADATA[type].name).toBeTruthy();
        expect(DELIVERABLE_METADATA[type].description).toBeTruthy();
        expect(DELIVERABLE_METADATA[type].category).toBeTruthy();
      });
    });
  });

  describe("getWorkflowRequirements", () => {
    it("should default to all deliverables when none selected", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [],
        jobState: {},
      });

      expect(result.requiredSteps.projectSetup).toBe(true);
      expect(result.requiredSteps.dataIntake).toBe(true);
      expect(result.requiredSteps.existingPlant).toBe(true);
      expect(result.requiredSteps.spanModeling).toBe(true);
      expect(result.requiredSteps.fieldCollection).toBe(true);
    });

    it("should require only minimal steps for GIS export only", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: {},
      });

      expect(result.requiredSteps.projectSetup).toBe(true);
      expect(result.requiredSteps.dataIntake).toBe(true);
      expect(result.requiredSteps.existingPlant).toBe(false);
      expect(result.requiredSteps.spanModeling).toBe(false);
      expect(result.requiredSteps.fieldCollection).toBe(false);
    });

    it("should require full workflow for permit report", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.PERMIT_REPORT],
        jobState: {},
      });

      expect(result.requiredSteps.projectSetup).toBe(true);
      expect(result.requiredSteps.dataIntake).toBe(true);
      expect(result.requiredSteps.existingPlant).toBe(true);
      expect(result.requiredSteps.spanModeling).toBe(true);
      expect(result.requiredSteps.fieldCollection).toBe(false);
    });

    it("should require field collection step only when field deliverable selected", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.FIELD_COLLECTION],
        jobState: {},
      });

      expect(result.requiredSteps.projectSetup).toBe(true);
      expect(result.requiredSteps.dataIntake).toBe(true);
      expect(result.requiredSteps.existingPlant).toBe(false);
      expect(result.requiredSteps.spanModeling).toBe(false);
      expect(result.requiredSteps.fieldCollection).toBe(true);
    });

    it("should combine requirements from multiple deliverables", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [
          DELIVERABLE_TYPES.GIS_EXPORT,
          DELIVERABLE_TYPES.FIELD_COLLECTION,
        ],
        jobState: {},
      });

      expect(result.requiredSteps.projectSetup).toBe(true);
      expect(result.requiredSteps.dataIntake).toBe(true);
      expect(result.requiredSteps.existingPlant).toBe(false);
      expect(result.requiredSteps.spanModeling).toBe(false);
      expect(result.requiredSteps.fieldCollection).toBe(true);
    });

    it("should validate project setup completion", () => {
      const incompleteState = {};
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: incompleteState,
      });

      expect(result.stepCompletionStatus.projectSetup).toBe("incomplete");
      expect(result.canProceedToOutputs).toBe(false);

      const completeState = {
        projectName: "Test Project",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
      };
      const result2 = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: completeState,
      });

      expect(result2.stepCompletionStatus.projectSetup).toBe("complete");
    });

    it("should validate data intake for GIS export", () => {
      const stateWithoutCoords = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        collectedPoles: [{ id: "pole1" }],
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: stateWithoutCoords,
      });

      expect(result.stepCompletionStatus.dataIntake).toBe("incomplete");
      expect(
        result.missingRequirements[DELIVERABLE_TYPES.GIS_EXPORT].canGenerate,
      ).toBe(false);

      const stateWithCoords = {
        ...stateWithoutCoords,
        collectedPoles: [
          { id: "pole1", latitude: 40.7128, longitude: -74.006 },
        ],
      };

      const result2 = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: stateWithCoords,
      });

      expect(result2.stepCompletionStatus.dataIntake).toBe("complete");
      expect(
        result2.missingRequirements[DELIVERABLE_TYPES.GIS_EXPORT].canGenerate,
      ).toBe(true);
    });

    it("should mark unrequired steps as not_required", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: {},
      });

      expect(result.stepCompletionStatus.existingPlant).toBe("not_required");
      expect(result.stepCompletionStatus.spanModeling).toBe("not_required");
      expect(result.stepCompletionStatus.fieldCollection).toBe("not_required");
    });

    it("should calculate completion percentage correctly", () => {
      const completeState = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        collectedPoles: [
          { id: "pole1", latitude: 40.7128, longitude: -74.006 },
        ],
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: completeState,
      });

      expect(result.completionPercentage).toBe(100);

      const partialState = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        // Missing pole coordinates
      };

      const result2 = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: partialState,
      });

      expect(result2.completionPercentage).toBe(50); // 1 of 2 required steps complete
    });

    it("should identify next suggested step", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: {},
      });

      expect(result.nextSuggestedStep).toBe(1); // Project Setup is first

      const withProjectSetup = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
      };

      const result2 = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: withProjectSetup,
      });

      expect(result2.nextSuggestedStep).toBe(2); // Data Intake is next
    });

    it("should generate user messages for incomplete steps", () => {
      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.PERMIT_REPORT],
        jobState: {},
      });

      expect(result.messages.length).toBeGreaterThan(0);
      const warningMessages = result.messages.filter(
        (m) => m.type === "warning",
      );
      expect(warningMessages.length).toBeGreaterThan(0);
    });

    it("should validate permit report requirements", () => {
      const incompleteState = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.PERMIT_REPORT],
        jobState: incompleteState,
      });

      expect(
        result.missingRequirements[DELIVERABLE_TYPES.PERMIT_REPORT].canGenerate,
      ).toBe(false);
      expect(
        result.missingRequirements[DELIVERABLE_TYPES.PERMIT_REPORT]
          .missingFields.length,
      ).toBeGreaterThan(0);

      const completeState = {
        projectName: "Test Project",
        jobNumber: "JOB-001",
        applicantName: "Test Applicant",
        jobOwner: "FirstEnergy",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        poleHeight: "40",
        poleClass: "2",
        existingPowerHeight: "30",
        existingPowerVoltage: "7200",
        spanDistance: "150",
        spanEnvironment: "road",
      };

      const result2 = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.PERMIT_REPORT],
        jobState: completeState,
      });

      expect(
        result2.missingRequirements[DELIVERABLE_TYPES.PERMIT_REPORT]
          .canGenerate,
      ).toBe(true);
    });

    it("should validate FirstEnergy export requirements", () => {
      const stateWithFEProfile = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        jobOwner: "Mon Power",
        poleHeight: "40",
        collectedPoles: [
          { id: "pole1", latitude: 40.7128, longitude: -74.006 },
        ],
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.FIRSTENERGY_EXPORT],
        jobState: stateWithFEProfile,
      });

      expect(
        result.missingRequirements[DELIVERABLE_TYPES.FIRSTENERGY_EXPORT]
          .canGenerate,
      ).toBe(true);
      expect(
        result.missingRequirements[DELIVERABLE_TYPES.FIRSTENERGY_EXPORT]
          .warnings.length,
      ).toBeGreaterThan(0); // Auto-calc warning
    });

    it("should validate clearance analysis requirements", () => {
      const completeState = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        existingPowerHeight: "30",
        existingPowerVoltage: "7200",
        spanDistance: "150",
        spanEnvironment: "road",
        poleHeight: "40",
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.CLEARANCE_ANALYSIS],
        jobState: completeState,
      });

      expect(
        result.missingRequirements[DELIVERABLE_TYPES.CLEARANCE_ANALYSIS]
          .canGenerate,
      ).toBe(true);
    });

    it("should validate existing plant doc requirements", () => {
      const stateWithoutLines = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.EXISTING_PLANT_DOC],
        jobState: stateWithoutLines,
      });

      expect(
        result.missingRequirements[DELIVERABLE_TYPES.EXISTING_PLANT_DOC]
          .canGenerate,
      ).toBe(false);

      const stateWithLines = {
        ...stateWithoutLines,
        existingLines: [
          { type: "power", height: "30", companyName: "Utility Co" },
        ],
      };

      const result2 = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.EXISTING_PLANT_DOC],
        jobState: stateWithLines,
      });

      expect(
        result2.missingRequirements[DELIVERABLE_TYPES.EXISTING_PLANT_DOC]
          .canGenerate,
      ).toBe(true);
    });

    it("should set canProceedToOutputs when all required steps complete", () => {
      const completeGISState = {
        projectName: "Test",
        currentJobId: "job123",
        currentSubmissionProfile: "firstEnergy",
        collectedPoles: [
          { id: "pole1", latitude: 40.7128, longitude: -74.006 },
        ],
      };

      const result = getWorkflowRequirements({
        selectedDeliverables: [DELIVERABLE_TYPES.GIS_EXPORT],
        jobState: completeGISState,
      });

      expect(result.canProceedToOutputs).toBe(true);
    });
  });
});
