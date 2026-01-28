/**
 * ExistingPlantPanel - Existing Plant step panel.
 * Wraps existing attachments and make-ready management.
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody } from "../../ui";
import { Button, StatusBadge } from "../../ui";

// Lazy load the existing lines editor
const ExistingLinesEditor = React.lazy(
  () => import("../../ExistingLinesEditor"),
);

export default function ExistingPlantPanel() {
  const { existingLines, currentJobId, workflowRequirements } = useAppStore(
    useShallow((s) => ({
      existingLines: s.existingLines || [],
      currentJobId: s.currentJobId,
      workflowRequirements: s.workflowRequirements,
    })),
  );

  const makeReadyCount = existingLines.filter((l) => l.makeReady).length;
  const totalLines = existingLines.length;
  const isOptional =
    workflowRequirements?.requiredSteps?.existingPlant === false;

  const handleSkip = () => {
    // AI: rationale — optional steps should be skippable without blocking outputs.
    window.dispatchEvent(
      new CustomEvent("ppp:skip-step", {
        detail: { stepId: "existing-plant" },
      }),
    );
  };

  return (
    <div className="ppp-main-content">
      {/* Panel Header */}
      <div className="ppp-panel-header">
        <div className="ppp-panel-header__title">
          <span className="ppp-panel-header__step-badge">3</span>
          <h1>Existing Plant</h1>
        </div>
        {totalLines > 0 && (
          <div className="ppp-panel-header__actions">
            <StatusBadge status={makeReadyCount > 0 ? "warning" : "success"}>
              {makeReadyCount > 0
                ? `${makeReadyCount} Make-Ready`
                : "No Make-Ready"}
            </StatusBadge>
          </div>
        )}
      </div>

      {/* Info banner when no job selected */}
      {!currentJobId && (
        <div
          className="ppp-info-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--blue-50, #eff6ff)",
            border: "1px solid var(--blue-200, #bfdbfe)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-4)",
            color: "var(--blue-800, #1e40af)",
            fontSize: "0.875rem",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            <strong>Tip:</strong> Create a job in Project Setup to save
            attachment data to a project.
          </span>
        </div>
      )}

      {isOptional && (
        <div
          className="ppp-info-banner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-4)",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            This step is optional for your selected deliverables.
          </span>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      )}

      {/* Summary */}
      {totalLines > 0 && (
        <div className="ppp-data-grid">
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Total Attachments</span>
            <span className="ppp-data-item__value">{totalLines}</span>
          </div>
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Require Make-Ready</span>
            <span
              className={`ppp-data-item__value ${makeReadyCount > 0 ? "ppp-data-item__value--fail" : "ppp-data-item__value--pass"}`}
            >
              {makeReadyCount}
            </span>
          </div>
        </div>
      )}

      {/* Existing Lines Editor */}
      <Card>
        <CardHeader step={3}>
          <span>Existing Attachments</span>
        </CardHeader>
        <CardBody>
          <React.Suspense
            fallback={
              <div className="ppp-loading">
                <div className="ppp-loading__spinner" />
                <span>Loading attachment editor...</span>
              </div>
            }
          >
            <ExistingLinesEditor />
          </React.Suspense>
        </CardBody>
      </Card>

      {/* Help text */}
      <Card>
        <CardHeader>
          <span>About Existing Plant</span>
        </CardHeader>
        <CardBody>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Document all existing attachments on the pole including power,
            telecom, CATV, and street lights. Identify any attachments requiring
            relocation (make-ready) to maintain proper clearances after your
            proposed attachment is installed.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
