/**
 * Enhanced Field Collection Panel
 * Improved UI with GPS capture, photo management, and offline sync
 */
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody, Button, StatusBadge } from "../../ui";
import { createFieldWorkflow } from "../../../utils/fieldWorkflow";

export default function EnhancedFieldCollectionPanel() {
  const {
    collectedPoles,
    _updateCollectedPole,
    _addCollectedPole,
    currentJobId,
  } = useAppStore(
    useShallow((s) => ({
      collectedPoles: s.collectedPoles || [],
      _updateCollectedPole: s.updateCollectedPole,
      _addCollectedPole: s.addCollectedPole,
      currentJobId: s.currentJobId,
    })),
  );

  // Field workflow manager
  const [fieldManager] = useState(() => createFieldWorkflow(useAppStore));

  // UI State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [_selectedPole, _setSelectedPole] = useState(null);
  const [showAddPole, setShowAddPole] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");

  // New pole form state
  const [newPole, setNewPole] = useState({
    height: "",
    class: "",
    notes: "",
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  const handleSync = React.useCallback(() => {
    setSyncStatus("syncing");
    // Sync implementation
    console.log("Syncing offline operations...");
    setTimeout(() => setSyncStatus("idle"), 1000);
  }, []);

  useEffect(() => {
    if (isOnline && fieldManager.pendingQueue.length > 0) {
      handleSync();
    }
  }, [isOnline, fieldManager.pendingQueue.length, handleSync]);

  // Statistics
  // AI: rationale — field stats are derived from the manager, so use a stable dependency list.
  const stats = useMemo(() => fieldManager.getFieldStats(), [fieldManager]);

  const handleCaptureGPS = async () => {
    setCapturingGPS(true);
    try {
      const coords = await fieldManager.captureGPSCoordinates({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      setNewPole((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
        gpsAccuracy: coords.accuracy,
      }));

      console.log("GPS captured:", coords);
    } catch (error) {
      console.error("GPS capture failed:", error);
      alert(
        `GPS capture failed: ${error.message}. Please enter coordinates manually or try again.`,
      );
    } finally {
      setCapturingGPS(false);
    }
  };

  const handleAddNewPole = async () => {
    const result = await fieldManager.addFieldPole(
      {
        ...newPole,
        jobId: currentJobId,
      },
      {
        captureGPS: false, // Already captured manually
        autoValidate: true,
        allowInvalid: true, // Allow saving even with validation warnings
      },
    );

    if (result.success) {
      // Reset form
      setNewPole({ height: "", class: "", notes: "" });
      setShowAddPole(false);

      if (result.warnings && result.warnings.length > 0) {
        console.warn("Pole saved with warnings:", result.warnings);
      }
    } else {
      alert(`Failed to add pole: ${result.errors.join(", ")}`);
    }
  };

  const handleMarkDone = (poleId) => {
    fieldManager.markPoleComplete(poleId);
  };

  const handleMarkPending = (poleId) => {
    fieldManager.updateFieldPole(poleId, { status: "pending" });
  };

  const handleAttachPhoto = async (poleId) => {
    // Trigger file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Use camera if available

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Convert to data URL for offline storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = await fieldManager.attachPhoto(poleId, {
          dataUrl: event.target.result,
          caption: "",
          type: "pole_tag",
        });

        if (!result.success) {
          alert(`Failed to attach photo: ${result.errors.join(", ")}`);
        }
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleExportFieldData = () => {
    const data = fieldManager.exportFieldData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `field-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  return (
    <div className="ppp-main-content">
      {/* Panel Header */}
      <div className="ppp-panel-header">
        <div className="ppp-panel-header__title">
          <span className="ppp-panel-header__step-badge">5</span>
          <h1>Field Collection</h1>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {/* Online/Offline Indicator */}
            <StatusBadge status={isOnline ? "pass" : "warn"}>
              {isOnline ? "Online" : "Offline"}
            </StatusBadge>

            {/* Pending Sync Badge */}
            {stats.pendingSync > 0 && (
              <StatusBadge status="draft">
                {stats.pendingSync} Pending Sync
              </StatusBadge>
            )}

            {/* Sync Button */}
            {isOnline && stats.pendingSync > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSync}
                disabled={syncStatus === "syncing"}
              >
                {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
              </Button>
            )}
          </div>
        </div>
        {stats.total > 0 && (
          <div className="ppp-panel-header__actions">
            <StatusBadge
              status={
                stats.done === stats.total
                  ? "done"
                  : stats.pending > 0
                    ? "draft"
                    : "pass"
              }
            >
              {stats.done}/{stats.total} Complete
            </StatusBadge>
            <Button variant="ghost" size="sm" onClick={handleExportFieldData}>
              Export Backup
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddPole(true)}
            >
              + Add Pole
            </Button>
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
          }}
        >
          <span>
            <strong>Tip:</strong> Create a job in Project Setup to organize
            field collection data.
          </span>
        </div>
      )}

      {/* Statistics Card */}
      <Card>
        <CardHeader>Field Collection Stats</CardHeader>
        <CardBody>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "var(--primary-600)",
                }}
              >
                {stats.total}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Total Poles
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "var(--green-600)",
                }}
              >
                {stats.done}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Completed
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "var(--blue-600)",
                }}
              >
                {stats.withGPS}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                With GPS
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "var(--purple-600)",
                }}
              >
                {stats.withPhotos}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                With Photos
              </div>
            </div>
          </div>

          {stats.total > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  height: "8px",
                  backgroundColor: "var(--gray-200)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor:
                      progress === 100 ? "var(--green-500)" : "var(--blue-500)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {progress.toFixed(0)}% Complete
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add New Pole Modal */}
      {showAddPole && (
        <Card>
          <CardHeader>Add New Pole</CardHeader>
          <CardBody>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* GPS Capture */}
              <div>
                <Button
                  variant="primary"
                  onClick={handleCaptureGPS}
                  disabled={capturingGPS}
                  fullWidth
                >
                  {capturingGPS
                    ? "Capturing GPS..."
                    : "📍 Capture GPS Location"}
                </Button>
                {newPole.latitude && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Coordinates: {newPole.latitude.toFixed(6)},{" "}
                    {newPole.longitude.toFixed(6)}
                    {newPole.gpsAccuracy &&
                      ` (±${newPole.gpsAccuracy.toFixed(1)}m)`}
                  </div>
                )}
              </div>

              {/* Pole Details */}
              <input
                type="text"
                placeholder="Pole Height (e.g., 35ft or 35' 6&quot;)"
                value={newPole.height}
                onChange={(e) =>
                  setNewPole({ ...newPole, height: e.target.value })
                }
                className="ppp-input"
              />

              <select
                value={newPole.class}
                onChange={(e) =>
                  setNewPole({ ...newPole, class: e.target.value })
                }
                className="ppp-select"
              >
                <option value="">Select Pole Class</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
                <option value="6">Class 6</option>
                <option value="H1">Class H1</option>
                <option value="H2">Class H2</option>
              </select>

              <textarea
                placeholder="Notes (optional)"
                value={newPole.notes}
                onChange={(e) =>
                  setNewPole({ ...newPole, notes: e.target.value })
                }
                className="ppp-textarea"
                rows={3}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddPole(false)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddNewPole}
                  disabled={!newPole.latitude || !newPole.height}
                  fullWidth
                >
                  Add Pole
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pole List */}
      <Card>
        <CardHeader step={5}>Collected Poles</CardHeader>
        <CardBody>
          {stats.total === 0 ? (
            <div className="ppp-empty-state">
              <h3>No Poles Collected</h3>
              <p>Click "Add Pole" to start field collection with GPS.</p>
              <Button variant="primary" onClick={() => setShowAddPole(true)}>
                Start Field Collection
              </Button>
            </div>
          ) : (
            <div className="ppp-table-wrapper">
              <table className="ppp-table">
                <thead>
                  <tr>
                    <th>Pole ID</th>
                    <th>Location</th>
                    <th>Height</th>
                    <th>Photos</th>
                    <th className="status">Status</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collectedPoles.map((pole, index) => (
                    <tr key={pole.id || index}>
                      <td>{pole.id?.slice(0, 8) || `#${index + 1}`}</td>
                      <td>
                        {pole.latitude && pole.longitude ? (
                          <span title={`${pole.latitude}, ${pole.longitude}`}>
                            {pole.latitude.toFixed(5)},{" "}
                            {pole.longitude.toFixed(5)}
                          </span>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="numeric">{pole.height || "--"}</td>
                      <td className="numeric">
                        {(pole.photos || []).length > 0 ? (
                          <span>📷 {pole.photos.length}</span>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="status">
                        <StatusBadge
                          status={pole.status === "done" ? "done" : "draft"}
                        >
                          {pole.status === "done" ? "Done" : "Pending"}
                        </StatusBadge>
                      </td>
                      <td className="actions">
                        <div style={{ display: "flex", gap: "4px" }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAttachPhoto(pole.id)}
                            title="Add Photo"
                          >
                            📷
                          </Button>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
