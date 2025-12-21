/**
 * JobSetupPanel - Project Setup step panel.
 * Wraps job metadata inputs and standards configuration.
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody, CardSection } from "../../ui";
import { Button } from "../../ui";
import { HelpTooltip } from "../../ui";

export default function JobSetupPanel() {
  const {
    jobs,
    currentJobId,
    setCurrentJobId,
    createJob,
    deleteJob,
    projectName,
    setProjectName,
    applicantName,
    setApplicantName,
    jobNumber,
    setJobNumber,
    jobOwner,
    setJobOwner,
    presetProfile,
    setPresetProfile,
    customMinTopSpace,
    setCustomMinTopSpace,
    customRoadClearance,
    setCustomRoadClearance,
    customCommToPower,
    setCustomCommToPower,
    useTickMarkFormat,
    setUseTickMarkFormat,
    submissionProfiles,
    currentSubmissionProfile,
    setCurrentSubmissionProfile,
  } = useAppStore(
    useShallow((s) => ({
      jobs: s.jobs,
      currentJobId: s.currentJobId,
      setCurrentJobId: s.setCurrentJobId,
      createJob: s.createJob,
      deleteJob: s.deleteJob,
      projectName: s.projectName,
      setProjectName: s.setProjectName,
      applicantName: s.applicantName,
      setApplicantName: s.setApplicantName,
      jobNumber: s.jobNumber,
      setJobNumber: s.setJobNumber,
      jobOwner: s.jobOwner,
      setJobOwner: s.setJobOwner,
      presetProfile: s.presetProfile,
      setPresetProfile: s.setPresetProfile,
      customMinTopSpace: s.customMinTopSpace,
      setCustomMinTopSpace: s.setCustomMinTopSpace,
      customRoadClearance: s.customRoadClearance,
      setCustomRoadClearance: s.setCustomRoadClearance,
      customCommToPower: s.customCommToPower,
      setCustomCommToPower: s.setCustomCommToPower,
      useTickMarkFormat: s.useTickMarkFormat,
      setUseTickMarkFormat: s.setUseTickMarkFormat,
      submissionProfiles: s.submissionProfiles,
      currentSubmissionProfile: s.currentSubmissionProfile,
      setCurrentSubmissionProfile: s.setCurrentSubmissionProfile,
    })),
  );

  const [newJobName, setNewJobName] = React.useState("");
  const [showNewJobInput, setShowNewJobInput] = React.useState(false);

  const currentJob = jobs?.find((j) => j.id === currentJobId);

  const handleCreateJob = () => {
    if (!newJobName.trim()) return;
    const newJob = createJob(newJobName.trim());
    setCurrentJobId(newJob.id);
    setNewJobName("");
    setShowNewJobInput(false);
  };

  const handleDeleteJob = () => {
    if (
      currentJobId &&
      window.confirm("Delete this job? This cannot be undone.")
    ) {
      deleteJob(currentJobId);
    }
  };

  const profileOptions = [
    { value: "WV-NESC", label: "WV / NESC (Default)" },
    { value: "OH-PUCO", label: "Ohio PUCO" },
    { value: "PA-PUC", label: "Pennsylvania PUC" },
    { value: "CUSTOM", label: "Custom Clearances" },
  ];

  return (
    <div className="ppp-main-content">
      {/* Panel Header */}
      <div className="ppp-panel-header">
        <div className="ppp-panel-header__title">
          <span className="ppp-panel-header__step-badge">1</span>
          <h1>Project Setup</h1>
        </div>
        <div className="ppp-panel-header__actions">
          {currentJobId && (
            <Button variant="ghost" size="sm" onClick={handleDeleteJob}>
              Delete Job
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewJobInput(true)}
          >
            + New Job
          </Button>
        </div>
      </div>

      {/* New Job Input */}
      {showNewJobInput && (
        <Card>
          <CardBody>
            <div className="ppp-field-group">
              <div className="ppp-field">
                <label className="ppp-field__label">Job Name</label>
                <input
                  type="text"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  placeholder="Enter job name..."
                  autoFocus
                />
              </div>
            </div>
            <div
              className="ppp-action-bar"
              style={{
                marginTop: "var(--space-4)",
                paddingTop: "var(--space-4)",
              }}
            >
              <Button variant="ghost" onClick={() => setShowNewJobInput(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateJob}
                disabled={!newJobName.trim()}
              >
                Create Job
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Job Selector */}
      {!showNewJobInput && jobs?.length > 0 && (
        <Card>
          <CardHeader>
            <span>Select Job</span>
          </CardHeader>
          <CardBody>
            <div className="ppp-field">
              <select
                value={currentJobId || ""}
                onChange={(e) => setCurrentJobId(e.target.value)}
              >
                <option value="">-- Select a job --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name || `Job ${j.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>
      )}

      {/* No Jobs State */}
      {!showNewJobInput && (!jobs || jobs.length === 0) && (
        <div className="ppp-empty-state">
          <svg
            className="ppp-empty-state__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="ppp-empty-state__title">No Jobs Yet</h3>
          <p className="ppp-empty-state__description">
            Create your first job to start a new pole attachment project.
          </p>
          <Button variant="primary" onClick={() => setShowNewJobInput(true)}>
            Create First Job
          </Button>
        </div>
      )}

      {/* Job Details */}
      {currentJobId && currentJob && (
        <>
          <Card>
            <CardHeader step={1}>
              <span>Job Metadata</span>
            </CardHeader>
            <CardBody>
              <div className="ppp-field-group">
                <div className="ppp-field">
                  <label className="ppp-field__label">Project Name</label>
                  <input
                    type="text"
                    value={projectName || ""}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Main St Fiber Build"
                  />
                </div>
                <div className="ppp-field">
                  <label className="ppp-field__label">Job Number</label>
                  <input
                    type="text"
                    value={jobNumber || ""}
                    onChange={(e) => setJobNumber(e.target.value)}
                    placeholder="e.g., JOB-2024-001"
                  />
                </div>
              </div>
              <div
                className="ppp-field-group"
                style={{ marginTop: "var(--space-4)" }}
              >
                <div className="ppp-field">
                  <label className="ppp-field__label">Applicant Name</label>
                  <input
                    type="text"
                    value={applicantName || ""}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g., Acme Telecom Inc."
                  />
                </div>
                <div className="ppp-field">
                  <label className="ppp-field__label">
                    Job Owner / Engineer
                  </label>
                  <input
                    type="text"
                    value={jobOwner || ""}
                    onChange={(e) => setJobOwner(e.target.value)}
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader step={1}>
              <span>Regulatory Profile</span>
            </CardHeader>
            <CardBody>
              <div className="ppp-field">
                <label className="ppp-field__label">
                  Standards Profile
                  <HelpTooltip content="Select the regulatory profile for clearance requirements. NESC is the default national standard." />
                </label>
                <select
                  value={presetProfile || "WV-NESC"}
                  onChange={(e) => setPresetProfile(e.target.value)}
                >
                  {profileOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {presetProfile === "CUSTOM" && (
                <div
                  className="ppp-field-group"
                  style={{ marginTop: "var(--space-4)" }}
                >
                  <div className="ppp-field">
                    <label className="ppp-field__label">
                      Comm→Power (ft)
                      <HelpTooltip content="Minimum vertical clearance between communication cables and power conductors" />
                    </label>
                    <input
                      type="number"
                      value={customCommToPower || 3.33}
                      onChange={(e) =>
                        setCustomCommToPower(parseFloat(e.target.value) || 3.33)
                      }
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="ppp-field">
                    <label className="ppp-field__label">
                      Min Top Space (ft)
                      <HelpTooltip content="Minimum clearance from pole tip to highest attachment" />
                    </label>
                    <input
                      type="number"
                      value={customMinTopSpace || 1}
                      onChange={(e) =>
                        setCustomMinTopSpace(parseFloat(e.target.value) || 1)
                      }
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div className="ppp-field">
                    <label className="ppp-field__label">
                      Road Clearance (ft)
                      <HelpTooltip content="Minimum clearance above road surface for cable sag" />
                    </label>
                    <input
                      type="number"
                      value={customRoadClearance || 18}
                      onChange={(e) =>
                        setCustomRoadClearance(parseFloat(e.target.value) || 18)
                      }
                      step="0.5"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span>Display Preferences</span>
            </CardHeader>
            <CardBody>
              <div className="ppp-field">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useTickMarkFormat}
                    onChange={(e) => setUseTickMarkFormat(e.target.checked)}
                  />
                  <span>Use tick-mark format (15' 6" instead of 15ft 6in)</span>
                </label>
              </div>

              {submissionProfiles?.length > 0 && (
                <div
                  className="ppp-field"
                  style={{ marginTop: "var(--space-4)" }}
                >
                  <label className="ppp-field__label">Submission Profile</label>
                  <select
                    value={currentSubmissionProfile || ""}
                    onChange={(e) =>
                      setCurrentSubmissionProfile(e.target.value)
                    }
                  >
                    <option value="">Default</option>
                    {submissionProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
