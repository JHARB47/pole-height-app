/**
 * PreflightCheckPanel - Displays validation results for exports/imports.
 */
import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardBody, Button } from "./ui";

export default function PreflightCheckPanel({
  title,
  result,
  onGoToStep,
  testId,
}) {
  const [copied, setCopied] = React.useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      // AI: rationale — provide copyable diagnostics for support and QA.
      const payload = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn("Failed to copy diagnostics", error);
    }
  };

  const handleGoToStep = (stepKey) => {
    if (onGoToStep) {
      onGoToStep(stepKey);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("ppp:goto-step", { detail: { stepId: stepKey } }),
    );
  };

  const errors = result.errors || [];
  const warnings = result.warnings || [];
  const suggestedActions = result.suggestedActions || [];

  return (
    <Card data-testid={testId || "preflight-panel"}>
      <CardHeader title={title || "Preflight Check"} />
      <CardBody>
        <div
          data-testid="preflight-results"
          data-ok={String(result.ok)}
          data-errors={errors.length}
          data-warnings={warnings.length}
          style={{ display: "none" }}
        />
        {errors.length === 0 && warnings.length === 0 && (
          <div
            className="ppp-info-banner"
            data-testid="preflight-success"
            style={{
              backgroundColor: "var(--success-muted)",
              border: "1px solid var(--success)",
              color: "var(--success)",
            }}
          >
            All checks passed. You are ready to proceed.
          </div>
        )}

        {errors.length > 0 && (
          <div
            style={{ marginBottom: "var(--space-4)" }}
            data-testid="preflight-errors"
          >
            <h4 style={{ marginBottom: "var(--space-2)" }}>Blocking Issues</h4>
            <ul style={{ paddingLeft: "var(--space-4)" }}>
              {errors.map((error) => (
                <li
                  key={`${error.code}-${error.message}`}
                  style={{ color: "var(--danger)" }}
                >
                  <strong>{error.code}</strong>: {error.message}
                  {error.examples?.length > 0 && (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Missing: {error.examples.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div
            style={{ marginBottom: "var(--space-4)" }}
            data-testid="preflight-warnings"
          >
            <h4 style={{ marginBottom: "var(--space-2)" }}>Warnings</h4>
            <ul style={{ paddingLeft: "var(--space-4)" }}>
              {warnings.map((warning) => (
                <li
                  key={`${warning.code}-${warning.message}`}
                  style={{ color: "var(--warning)" }}
                >
                  <strong>{warning.code}</strong>: {warning.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestedActions.length > 0 && (
          <div
            style={{ marginBottom: "var(--space-4)" }}
            data-testid="preflight-actions"
          >
            <h4 style={{ marginBottom: "var(--space-2)" }}>
              Suggested Actions
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {suggestedActions.map((action) => (
                <div key={`${action.step}-${action.action}`}>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    {action.message}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGoToStep(action.step)}
                    style={{ marginTop: "var(--space-2)" }}
                    data-testid={`preflight-action-${action.step}`}
                  >
                    Go to {action.stepLabel || action.step}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          data-testid="preflight-copy"
        >
          {copied ? "Diagnostics Copied" : "Copy Diagnostics"}
        </Button>
      </CardBody>
    </Card>
  );
}

PreflightCheckPanel.propTypes = {
  title: PropTypes.string,
  result: PropTypes.shape({
    ok: PropTypes.bool,
    errors: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        message: PropTypes.string,
        fieldPath: PropTypes.string,
        affectedCount: PropTypes.number,
        examples: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
    warnings: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        message: PropTypes.string,
      }),
    ),
    missingSteps: PropTypes.arrayOf(PropTypes.string),
    suggestedActions: PropTypes.arrayOf(
      PropTypes.shape({
        step: PropTypes.string,
        stepLabel: PropTypes.string,
        action: PropTypes.string,
        message: PropTypes.string,
      }),
    ),
  }),
  onGoToStep: PropTypes.func,
  testId: PropTypes.string,
};
