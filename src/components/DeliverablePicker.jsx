/**
 * DeliverablePicker - Multi-select deliverable selector
 *
 * Allows users to select which deliverables they need for this job,
 * which in turn determines required vs optional workflow steps.
 */

import React, { useState } from "react";
import useAppStore from "../utils/store.js";
import {
  DELIVERABLE_METADATA,
  DELIVERABLE_TYPES,
} from "../utils/workflowEngine.js";

const CATEGORY_LABELS = {
  exports: "Exports & Reports",
  field_work: "Field Collection",
  analysis: "Analysis & Documentation",
};

export default function DeliverablePicker({ compact = false }) {
  const selectedDeliverables = useAppStore((s) => s.selectedDeliverables || []);
  const toggleDeliverable = useAppStore((s) => s.toggleDeliverable);
  const setWorkflowMode = useAppStore((s) => s.setWorkflowMode);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Group deliverables by category
  const deliverablesByCategory = Object.values(DELIVERABLE_METADATA).reduce(
    (acc, meta) => {
      if (!acc[meta.category]) {
        acc[meta.category] = [];
      }
      acc[meta.category].push(meta);
      return acc;
    },
    {},
  );

  // If no deliverables selected, show "All" indicator (backward compatibility)
  const isAllMode = selectedDeliverables.length === 0;

  const handleToggle = (deliverableId) => {
    toggleDeliverable(deliverableId);
  };

  const handleSelectAll = () => {
    const allIds = Object.values(DELIVERABLE_METADATA).map((d) => d.id);
    useAppStore.getState().setSelectedDeliverables(allIds);
  };

  const handleClearAll = () => {
    useAppStore.getState().setSelectedDeliverables([]);
  };

  const handleCustomizeSelection = () => {
    // AI: rationale — switch from implicit "all" mode to explicit selection so users can uncheck items.
    const allIds = Object.values(DELIVERABLE_METADATA).map((d) => d.id);
    useAppStore.getState().setSelectedDeliverables(allIds);
  };

  const handleQuickWorkflow = () => {
    const quickDeliverables = [
      DELIVERABLE_TYPES.GIS_EXPORT,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    ];
    useAppStore.getState().setSelectedDeliverables(quickDeliverables);
    setWorkflowMode("flex");
  };

  if (compact && !isExpanded) {
    return (
      <div
        className="deliverable-picker-compact"
        data-testid="deliverable-picker"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="btn btn-sm btn-outline"
          aria-label="Select deliverables"
          data-testid="deliverable-picker-toggle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: "4px" }}
          >
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Deliverables
          {isAllMode ? (
            <span
              className="badge badge-secondary"
              style={{ marginLeft: "6px" }}
            >
              All
            </span>
          ) : (
            <span className="badge badge-primary" style={{ marginLeft: "6px" }}>
              {selectedDeliverables.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="deliverable-picker card" data-testid="deliverable-picker">
      <div className="card-header">
        <h3 className="card-title">Select Deliverables</h3>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="btn btn-sm btn-ghost"
            aria-label="Collapse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="card-body">
        <p className="text-muted mb-3">
          Choose what you need to produce for this job. This will determine
          which workflow steps are required vs optional.
        </p>

        <div className="btn-group mb-4">
          <button
            onClick={handleSelectAll}
            className="btn btn-sm btn-outline"
            disabled={
              Object.keys(DELIVERABLE_METADATA).length ===
              selectedDeliverables.length
            }
            data-testid="deliverable-select-all"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="btn btn-sm btn-outline"
            disabled={selectedDeliverables.length === 0}
            data-testid="deliverable-clear-all"
          >
            Clear All
          </button>
          {isAllMode && (
            <button
              onClick={handleCustomizeSelection}
              className="btn btn-sm btn-outline"
              data-testid="deliverable-customize"
            >
              Customize Selection
            </button>
          )}
        </div>

        <div className="mb-4">
          <button
            onClick={handleQuickWorkflow}
            className="btn btn-sm btn-primary"
            data-testid="deliverable-quick-workflow"
          >
            Quick Import → Calc → Export
          </button>
          <p className="text-muted mt-2">
            Recommended for fast GIS + clearance outputs without full workflow
            gating.
          </p>
        </div>

        {isAllMode && (
          <div
            className="alert alert-info mb-3"
            data-testid="deliverable-all-mode"
          >
            <strong>All deliverables enabled</strong> - Full 6-step workflow
            required (classic mode)
            <div style={{ marginTop: "var(--space-2)" }}>
              <button
                onClick={handleCustomizeSelection}
                className="btn btn-sm btn-outline"
                data-testid="deliverable-customize-inline"
              >
                Switch to Custom Selection
              </button>
            </div>
          </div>
        )}

        {Object.entries(deliverablesByCategory).map(
          ([category, deliverables]) => (
            <div key={category} className="deliverable-category mb-4">
              <h4 className="category-label">
                {CATEGORY_LABELS[category] || category}
              </h4>
              <div className="deliverable-list">
                {deliverables.map((meta) => {
                  const isSelected =
                    isAllMode || selectedDeliverables.includes(meta.id);
                  return (
                    <label
                      key={meta.id}
                      className={`deliverable-item ${isSelected ? "selected" : ""}`}
                      data-testid={`deliverable-item-${meta.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(meta.id)}
                        disabled={isAllMode}
                        data-testid={`deliverable-checkbox-${meta.id}`}
                      />
                      <div className="deliverable-content">
                        <div className="deliverable-name">
                          <IconComponent name={meta.icon} />
                          <span>{meta.name}</span>
                        </div>
                        <div className="deliverable-description">
                          {meta.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>

      <style>{`
        .deliverable-picker {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        
        .deliverable-picker-compact {
          display: inline-block;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .card-body {
          padding: 16px;
        }

        .btn-group {
          display: flex;
          gap: 8px;
        }

        .deliverable-category {
          margin-bottom: 24px;
        }

        .category-label {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .deliverable-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .deliverable-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .deliverable-item:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .deliverable-item.selected {
          border-color: #3b82f6;
          background-color: #dbeafe;
        }

        .deliverable-item input[type="checkbox"] {
          margin-top: 2px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .deliverable-item input[type="checkbox"]:disabled {
          cursor: not-allowed;
        }

        .deliverable-content {
          flex: 1;
        }

        .deliverable-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .deliverable-description {
          font-size: 13px;
          color: #6b7280;
        }

        .text-muted {
          color: #6b7280;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .alert-info {
          background-color: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 9999px;
        }

        .badge-primary {
          background-color: #3b82f6;
          color: white;
        }

        .badge-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-outline {
          border: 1px solid #d1d5db;
          background-color: white;
          color: #374151;
        }

        .btn-outline:hover:not(:disabled) {
          border-color: #3b82f6;
          background-color: #eff6ff;
          color: #3b82f6;
        }

        .btn-outline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-ghost {
          background-color: transparent;
          color: #6b7280;
        }

        .btn-ghost:hover {
          background-color: #f3f4f6;
        }

        .mb-3 {
          margin-bottom: 12px;
        }

        .mb-4 {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}

// Simple icon component (replace with Lucide React if available)
function IconComponent({ name }) {
  const icons = {
    map: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
      </svg>
    ),
    "file-text": (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    table: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
      </svg>
    ),
    "map-pin": (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    ),
    activity: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
    clipboard: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
    ),
  };

  return icons[name] || null;
}
