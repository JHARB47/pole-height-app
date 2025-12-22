/**
 * FieldCollectionPanel - Field Collection step panel.
 * Wraps field data collection (GPS, photos, status updates).
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody } from "../../ui";
import { Button, StatusBadge } from "../../ui";

export default function FieldCollectionPanel() {
  const { collectedPoles, updateCollectedPole, currentJobId } = useAppStore(
    useShallow((s) => ({
      collectedPoles: s.collectedPoles || [],
      updateCollectedPole: s.updateCollectedPole,
      currentJobId: s.currentJobId,
    })),
  );

  const doneCount = collectedPoles.filter((p) => p.status === "done").length;
  const pendingCount = collectedPoles.filter(
    (p) => p.status === "pending" || !p.status,
  ).length;
  const totalPoles = collectedPoles.length;
  const progress = totalPoles > 0 ? (doneCount / totalPoles) * 100 : 0;

  const handleMarkDone = (poleId) => {
    updateCollectedPole(poleId, { status: "done" });
  };

  const handleMarkPending = (poleId) => {
    updateCollectedPole(poleId, { status: "pending" });
  };

  return (
    <div className="ppp-main-content">
      {/* Panel Header */}
      <div className="ppp-panel-header">
        <div className="ppp-panel-header__title">
          <span className="ppp-panel-header__step-badge">5</span>
          <h1>Field Collection</h1>
        </div>
        {totalPoles > 0 && (
          <div className="ppp-panel-header__actions">
            <StatusBadge
              status={
                doneCount === totalPoles
                  ? "done"
                  : pendingCount > 0
                    ? "draft"
                    : "pass"
              }
            >
              {doneCount}/{totalPoles} Complete
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
            <strong>Tip:</strong> Create a job in Project Setup to save field
            collection data to a project.
          </span>
        </div>
      )}

      {/* Progress */}
      {totalPoles > 0 && (
        <Card>
          <CardBody>
            <div className="ppp-progress">
              <div className="ppp-progress__bar">
                <div
                  className={`ppp-progress__fill ${progress === 100 ? "ppp-progress__fill--success" : ""}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="ppp-progress__label">
                <span>{doneCount} completed</span>
                <span>{pendingCount} remaining</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pole List */}
      <Card>
        <CardHeader step={5}>
          <span>Collected Poles</span>
        </CardHeader>
        <CardBody>
          {totalPoles === 0 ? (
            <div
              className="ppp-empty-state"
              style={{ background: "transparent", border: "none" }}
            >
              <svg
                className="ppp-empty-state__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <h3 className="ppp-empty-state__title">No Poles Collected</h3>
              <p className="ppp-empty-state__description">
                Import pole data in Data Intake, or use the Field Mode to
                collect poles with GPS.
              </p>
              <Button variant="primary">Start Field Collection</Button>
            </div>
          ) : (
            <div className="ppp-table-wrapper">
              <table className="ppp-table">
                <thead>
                  <tr>
                    <th>Pole ID</th>
                    <th>Location</th>
                    <th>Height</th>
                    <th className="status">Status</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collectedPoles.map((pole) => (
                    <tr key={pole.id}>
                      <td>{pole.poleId || pole.id?.slice(0, 8)}</td>
                      <td>
                        {pole.latitude && pole.longitude
                          ? `${pole.latitude.toFixed(5)}, ${pole.longitude.toFixed(5)}`
                          : "--"}
                      </td>
                      <td className="numeric">{pole.height || "--"}</td>
                      <td className="status">
                        <StatusBadge
                          status={pole.status === "done" ? "done" : "draft"}
                        >
                          {pole.status === "done" ? "Done" : "Pending"}
                        </StatusBadge>
                      </td>
                      <td className="actions">
                        {pole.status === "done" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPending(pole.id)}
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkDone(pole.id)}
                          >
                            Mark Done
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <span>Field Collection Tips</span>
        </CardHeader>
        <CardBody>
          <ul
            style={{
              margin: 0,
              paddingLeft: "var(--space-6)",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              lineHeight: 1.8,
            }}
          >
            <li>Use high-accuracy GPS mode for coordinates (if available)</li>
            <li>Capture pole tag photos for verification</li>
            <li>Note any visible damage or lean</li>
            <li>Record attachment heights from ground level</li>
            <li>Mark poles as "Done" when all data is collected</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
