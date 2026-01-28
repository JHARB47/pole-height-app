import React from "react";
import PropTypes from "prop-types";
import useAppStore from "../../utils/store";
import { useShallow } from "zustand/react/shallow";
import {
  AppShell,
  AppHeader,
  StepNavigation,
  MobileBottomBar,
  HelpModal,
  useHelpModal,
} from "../layout";
import { Button, ToastProvider, useToast } from "../ui";
import ErrorBoundary from "../ErrorBoundary";
import {
  logLockedStepTap,
  logStepComplete,
  logStepEnter,
} from "../../utils/telemetry";
import "../../styles/globals.css";
import "./WorkflowApp.css";

// Lazy load step panels to maintain code splitting
const JobSetupPanel = React.lazy(() => import("./panels/JobSetupPanel"));
const DataIntakePanel = React.lazy(() => import("./panels/DataIntakePanel"));
const ExistingPlantPanel = React.lazy(
  () => import("./panels/ExistingPlantPanel"),
);
const SpanModelingPanel = React.lazy(
  () => import("./panels/SpanModelingPanel"),
);
const FieldCollectionPanel = React.lazy(
  () => import("./panels/FieldCollectionPanel"),
);
const OutputsPanel = React.lazy(() => import("./panels/OutputsPanel"));

// Loading fallback component
const PanelLoading = () => (
  <div className="ppp-loading">
    <div className="ppp-loading__spinner" />
    <span>Loading...</span>
  </div>
);

// Error fallback for lazy load failures
const PanelError = ({ error, resetErrorBoundary }) => (
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
    <h3 className="ppp-empty-state__title">Failed to Load</h3>
    <p className="ppp-empty-state__description">
      {error?.message || "Something went wrong loading this section."}
    </p>
    <Button variant="primary" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </div>
);

// AI: PropTypes for PanelError component
PanelError.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  resetErrorBoundary: PropTypes.func.isRequired,
};

/**
 * WorkflowAppContent - Inner component that uses toast context
 */
function WorkflowAppContent() {
  const toast = useToast();

  // Zustand store
  const {
    jobs,
    currentJobId,
    setCurrentJobId,
    collectedPoles,
    importedSpans,
    existingLines,
    workflowRequirements,
    workflowMode,
    selectedDeliverables,
    updateWorkflowRequirements,
    projectName,
    jobNumber,
    applicantName,
    jobOwner,
    currentSubmissionProfile,
    existingPowerHeight,
    existingPowerVoltage,
    spanDistance,
    spanEnvironment,
    poleHeight,
    proposedLineHeight,
  } = useAppStore(
    useShallow((s) => ({
      jobs: s.jobs,
      currentJobId: s.currentJobId,
      setCurrentJobId: s.setCurrentJobId,
      collectedPoles: s.collectedPoles || [],
      importedSpans: s.importedSpans || [],
      existingLines: s.existingLines || [],
      workflowRequirements: s.workflowRequirements,
      workflowMode: s.workflowMode || "guided",
      selectedDeliverables: s.selectedDeliverables || [],
      updateWorkflowRequirements: s.updateWorkflowRequirements,
      projectName: s.projectName,
      jobNumber: s.jobNumber,
      applicantName: s.applicantName,
      jobOwner: s.jobOwner,
      currentSubmissionProfile: s.currentSubmissionProfile,
      existingPowerHeight: s.existingPowerHeight,
      existingPowerVoltage: s.existingPowerVoltage,
      spanDistance: s.spanDistance,
      spanEnvironment: s.spanEnvironment,
      poleHeight: s.poleHeight,
      proposedLineHeight: s.proposedLineHeight,
    })),
  );

  // UI State
  const [activeStep, setActiveStep] = React.useState("project-setup");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [appStatus, setAppStatus] = React.useState("ready");

  // Step timing for telemetry (transient - not persisted)
  const stepStartTimes = React.useRef({});

  // Help modal
  const { isOpen: helpOpen, openHelp, closeHelp } = useHelpModal();

  // Computed states for step prerequisites
  const hasJob = Boolean(currentJobId);
  const hasPoles = collectedPoles.length > 0 || importedSpans.length > 0;
  const hasExistingLines = existingLines.length > 0;
  const donePolesCount = collectedPoles.filter(
    (p) => p.status === "done",
  ).length;

  const stepKeyMap = React.useMemo(
    () => ({
      "project-setup": "projectSetup",
      "data-intake": "dataIntake",
      "existing-plant": "existingPlant",
      "span-modeling": "spanModeling",
      "field-collection": "fieldCollection",
      outputs: "outputs",
    }),
    [],
  );

  const getStepBadge = React.useCallback(
    (stepId) => {
      const stepKey = stepKeyMap[stepId];
      const required = workflowRequirements?.requiredSteps?.[stepKey];
      const status = workflowRequirements?.stepCompletionStatus?.[stepKey];

      if (status === "complete") {
        return { type: "success", label: "Complete" };
      }

      if (required === false) {
        return { type: "default", label: "Optional" };
      }

      if (required === true && workflowMode === "flex") {
        return { type: "info", label: "Recommended" };
      }

      if (required === true) {
        return { type: "warning", label: "Required" };
      }

      return undefined;
    },
    [stepKeyMap, workflowRequirements, workflowMode],
  );

  const getStepStatus = React.useCallback(
    (stepKey, fallbackComplete) => {
      const status = workflowRequirements?.stepCompletionStatus?.[stepKey];
      if (status === "complete") return "complete";
      return fallbackComplete ? "complete" : "pending";
    },
    [workflowRequirements],
  );

  // Step configuration - all steps are now accessible without strict prerequisites
  // Users can explore features and import data without creating a job first
  const steps = React.useMemo(
    () => [
      {
        id: "project-setup",
        label: "Project Setup",
        subtitle: "Job metadata & standards",
        status: getStepStatus("projectSetup", hasJob),
        badge: getStepBadge("project-setup"),
        // No requires - always accessible
      },
      {
        id: "data-intake",
        label: "Data Intake",
        subtitle: "Import & field mapping",
        count: importedSpans.length,
        status: getStepStatus("dataIntake", hasPoles),
        badge: getStepBadge("data-intake"),
        // No requires - allow data import without job
      },
      {
        id: "existing-plant",
        label: "Existing Plant",
        subtitle: "Attachments & make-ready",
        count: existingLines.length,
        status: getStepStatus("existingPlant", hasExistingLines),
        badge: getStepBadge("existing-plant"),
        // No requires - allow exploration without job
      },
      {
        id: "span-modeling",
        label: "Span & Clearance",
        subtitle: "Compute clearances",
        count: importedSpans.length,
        status: getStepStatus("spanModeling", importedSpans.length > 0),
        badge: getStepBadge("span-modeling"),
        // No requires - allow span modeling without job
      },
      {
        id: "field-collection",
        label: "Field Collection",
        subtitle: "GPS, photos, status",
        count: collectedPoles.length,
        status: getStepStatus("fieldCollection", donePolesCount > 0),
        badge: getStepBadge("field-collection"),
        // No requires - allow field collection without job
      },
      {
        id: "outputs",
        label: "Outputs",
        subtitle: "Reports & exports",
        status: workflowRequirements?.canProceedToOutputs
          ? "complete"
          : getStepStatus("outputs", hasPoles),
        badge: getStepBadge("outputs"),
        // No requires - allow exports when data exists
      },
    ],
    [
      hasJob,
      hasPoles,
      hasExistingLines,
      donePolesCount,
      importedSpans.length,
      collectedPoles.length,
      existingLines.length,
      workflowRequirements,
      getStepBadge,
      getStepStatus,
    ],
  );

  React.useEffect(() => {
    // AI: rationale — keep workflow requirements synced with the latest store data.
    updateWorkflowRequirements?.();
  }, [
    updateWorkflowRequirements,
    selectedDeliverables,
    projectName,
    jobNumber,
    applicantName,
    jobOwner,
    currentJobId,
    currentSubmissionProfile,
    existingPowerHeight,
    existingPowerVoltage,
    spanDistance,
    spanEnvironment,
    poleHeight,
    proposedLineHeight,
    collectedPoles,
    importedSpans,
    existingLines,
  ]);

  // Handle step navigation
  const handleStepClick = (stepId) => {
    // Track step start time when navigating to it
    if (!stepStartTimes.current[stepId]) {
      stepStartTimes.current[stepId] = performance.now();
    }
    // Telemetry: log step entry for funnel analysis
    logStepEnter({ stepId });
    setActiveStep(stepId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  // Track step completions and log telemetry
  React.useEffect(() => {
    steps.forEach((step) => {
      const wasComplete = stepStartTimes.current[`${step.id}_complete`];
      const isComplete = step.status === "complete";

      // Log when step transitions to complete and we have a start time
      if (isComplete && !wasComplete && stepStartTimes.current[step.id]) {
        const durationMs = performance.now() - stepStartTimes.current[step.id];
        logStepComplete({ stepId: step.id, durationMs });
        stepStartTimes.current[`${step.id}_complete`] = true;
      }
    });
  }, [steps]);

  // Get current step info for mobile bar
  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);
  const currentStep = steps[currentStepIndex];
  const currentStepKey = stepKeyMap[currentStep?.id];
  const currentStepRequired =
    workflowRequirements?.requiredSteps?.[currentStepKey] !== false;

  // Job selector component
  const jobSelector = (
    <select
      value={currentJobId || ""}
      onChange={(e) => setCurrentJobId(e.target.value)}
      aria-label="Select current job"
    >
      <option value="">-- Select Job --</option>
      {(jobs || []).map((j) => (
        <option key={j.id} value={j.id}>
          {j.name || `Job ${j.id.slice(0, 8)}`}
        </option>
      ))}
    </select>
  );

  // Render active panel
  const renderActivePanel = () => {
    return (
      <React.Suspense fallback={<PanelLoading />}>
        {activeStep === "project-setup" && <JobSetupPanel />}
        {activeStep === "data-intake" && <DataIntakePanel />}
        {activeStep === "existing-plant" && <ExistingPlantPanel />}
        {activeStep === "span-modeling" && <SpanModelingPanel />}
        {activeStep === "field-collection" && <FieldCollectionPanel />}
        {activeStep === "outputs" && <OutputsPanel toast={toast} />}
      </React.Suspense>
    );
  };

  React.useEffect(() => {
    const handleGoToStep = (event) => {
      const targetStep = event?.detail?.stepId;
      if (targetStep) {
        setActiveStep(targetStep);
        setSidebarOpen(false);
      }
    };

    const handleSkipStep = (event) => {
      const fromStep = event?.detail?.stepId;
      const fromIndex = steps.findIndex((s) => s.id === fromStep);
      const nextStep = steps[fromIndex + 1] || steps[steps.length - 1];
      if (nextStep?.id) {
        setActiveStep(nextStep.id);
        setSidebarOpen(false);
      }
    };

    window.addEventListener("ppp:goto-step", handleGoToStep);
    window.addEventListener("ppp:skip-step", handleSkipStep);

    return () => {
      window.removeEventListener("ppp:goto-step", handleGoToStep);
      window.removeEventListener("ppp:skip-step", handleSkipStep);
    };
  }, [steps]);

  // Handle save with toast feedback
  const handleSave = () => {
    setAppStatus("saving");
    // Actual save is handled by Zustand persist middleware
    setTimeout(() => {
      setAppStatus("ready");
      toast.success("Project saved successfully");
    }, 500);
  };

  // Handle locked step tap (mobile feedback)
  const handleLockedStepClick = (requires, stepId) => {
    // Telemetry: log locked step tap
    logLockedStepTap({ stepId, requiresLabel: requires.label });
    toast.warning(`Locked: Requires ${requires.label} — ${requires.reason}`);
  };

  return (
    <>
      <AppShell
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        header={
          <AppHeader
            jobSelector={jobSelector}
            onHelpClick={openHelp}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            status={appStatus}
          />
        }
        sidebar={
          <StepNavigation
            steps={steps}
            activeStep={activeStep}
            onStepClick={handleStepClick}
            onLockedStepClick={handleLockedStepClick}
          />
        }
      >
        <div
          data-testid="workflow-requirements-ready"
          data-ready={Boolean(workflowRequirements)}
          style={{ display: "none" }}
        />
        {/* AI: Pass activeStep as resetKey so errors clear when switching panels */}
        <ErrorBoundary fallback={PanelError} resetKey={activeStep}>
          {renderActivePanel()}
        </ErrorBoundary>
      </AppShell>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar
        stepInfo={{
          current: currentStepIndex + 1,
          total: steps.length,
          label:
            currentStep?.label && currentStepRequired === false
              ? `${currentStep.label} (Optional)`
              : workflowMode === "flex" && currentStep?.label
                ? `${currentStep.label} (Recommended)`
                : currentStep?.label || "",
        }}
        primaryAction={
          <Button variant="primary" size="md" onClick={handleSave}>
            Save
          </Button>
        }
      />

      {/* Help Modal */}
      <HelpModal open={helpOpen} onClose={closeHelp} />
    </>
  );
}

/**
 * WorkflowApp - Main application component wrapped with ToastProvider.
 */
export function WorkflowApp() {
  return (
    <ToastProvider>
      <WorkflowAppContent />
    </ToastProvider>
  );
}

export default WorkflowApp;
