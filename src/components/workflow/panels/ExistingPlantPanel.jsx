/**
 * ExistingPlantPanel - Existing Plant step panel.
 * Wraps existing attachments and make-ready management.
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody } from "../../ui";
import { StatusBadge } from "../../ui";

// Lazy load the existing lines editor
const ExistingLinesEditor = React.lazy(
  () => import("../../ExistingLinesEditor"),
);

export default function ExistingPlantPanel() {
  const { existingLines, currentJobId } = useAppStore(
    useShallow((s) => ({
      existingLines: s.existingLines || [],
      currentJobId: s.currentJobId,
    })),
  );

  const makeReadyCount = existingLines.filter((l) => l.makeReady).length;
  const totalLines = existingLines.length;

  if (!currentJobId) {
    return (
      <div className="ppp-main-content">
        <div className="ppp-panel-header">
          <div className="ppp-panel-header__title">
            <span className="ppp-panel-header__step-badge">3</span>
            <h1>Existing Plant</h1>
          </div>
        </div>
        <div className="ppp-empty-state">
          <svg
            className="ppp-empty-state__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <h3 className="ppp-empty-state__title">No Job Selected</h3>
          <p className="ppp-empty-state__description">
            Select or create a job in Project Setup first.
          </p>
        </div>
      </div>
    );
  }

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
