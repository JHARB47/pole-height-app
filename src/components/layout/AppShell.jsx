import React from "react";
import PropTypes from "prop-types";
import "./AppShell.css";

/**
 * AppShell - Main layout wrapper with sticky header, sidebar nav, and main content area.
 * Provides the professional 3-zone layout for PolePlan Pro.
 */
export function AppShell({
  children,
  header,
  sidebar,
  sidebarOpen = true,
  onSidebarToggle,
}) {
  return (
    <div className="ppp-shell">
      {header}
      <div className="ppp-shell__body">
        {sidebar && (
          <aside
            className={`ppp-shell__sidebar ${sidebarOpen ? "ppp-shell__sidebar--open" : ""}`}
            aria-label="Workflow navigation"
          >
            {sidebar}
          </aside>
        )}
        <main className="ppp-shell__main">
          <div className="ppp-shell__content">{children}</div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="ppp-shell__backdrop"
          onClick={onSidebarToggle}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

AppShell.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  sidebar: PropTypes.node,
  sidebarOpen: PropTypes.bool,
  onSidebarToggle: PropTypes.func,
};

/**
 * AppHeader - Sticky header with logo, job selector, status, and help button
 */
export function AppHeader({
  jobSelector,
  onHelpClick,
  onMenuClick,
  status = "ready",
}) {
  const statusConfig = {
    ready: { color: "success", label: "Ready", icon: "✓" },
    loading: { color: "warning", label: "Loading...", icon: "○" },
    saving: { color: "info", label: "Saving...", icon: "○" },
    error: { color: "danger", label: "Error", icon: "!" },
  };

  const { color, label, icon } = statusConfig[status] || statusConfig.ready;

  return (
    <header className="ppp-header">
      <div className="ppp-header__left">
        {/* Mobile menu button */}
        <button
          type="button"
          className="ppp-header__menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Logo */}
        <div className="ppp-header__logo">
          <svg
            className="ppp-header__logo-icon"
            viewBox="0 0 32 32"
            fill="none"
          >
            <rect
              x="2"
              y="14"
              width="4"
              height="16"
              rx="1"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="10"
              y="8"
              width="4"
              height="22"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="18"
              y="12"
              width="4"
              height="18"
              rx="1"
              fill="currentColor"
              opacity="0.6"
            />
            <rect
              x="26"
              y="6"
              width="4"
              height="24"
              rx="1"
              fill="currentColor"
              opacity="0.4"
            />
            <path
              d="M4 14c4-8 16-8 24-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
          <span className="ppp-header__logo-text">PolePlan Pro</span>
        </div>

        {/* Job Selector */}
        {jobSelector && (
          <div className="ppp-header__job">
            <span className="ppp-header__job-label">Job:</span>
            {jobSelector}
          </div>
        )}
      </div>

      <div className="ppp-header__right">
        {/* Status Indicator */}
        <div className={`ppp-header__status ppp-header__status--${color}`}>
          <span className="ppp-header__status-icon">{icon}</span>
          <span className="ppp-header__status-label">{label}</span>
        </div>

        {/* Help Button */}
        <button
          type="button"
          className="ppp-header__help-btn"
          onClick={onHelpClick}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7.5 7.5a2.5 2.5 0 1 1 3.54 2.28c-.66.45-1.04 1.15-1.04 1.97V12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
          </svg>
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}

AppHeader.propTypes = {
  jobSelector: PropTypes.node,
  onHelpClick: PropTypes.func,
  onMenuClick: PropTypes.func,
  status: PropTypes.oneOf(["ready", "loading", "saving", "error"]),
};

/**
 * StepNavigation - Left sidebar step navigation with status indicators
 */
export function StepNavigation({
  steps,
  activeStep,
  onStepClick,
  onLockedStepClick, // Callback for mobile tap feedback on locked steps
  disabled = false,
}) {
  return (
    <nav className="ppp-step-nav" aria-label="Workflow steps">
      <ul className="ppp-step-nav__list">
        {steps.map((step, index) => {
          const isActive = activeStep === step.id;
          const isCompleted = step.status === "complete";
          // Single source of truth: disabled derives from requires.isMet
          const isDisabled =
            disabled || (step.requires && !step.requires.isMet);

          const handleClick = (e) => {
            if (isDisabled) {
              e.preventDefault();
              // Mobile tap feedback for locked steps
              if (step.requires && onLockedStepClick) {
                onLockedStepClick(step.requires, step.id);
              }
              return;
            }
            onStepClick?.(step.id);
          };

          return (
            <li key={step.id} className="ppp-step-nav__item">
              <button
                type="button"
                className={`ppp-step-nav__button ${isActive ? "ppp-step-nav__button--active" : ""} ${isCompleted ? "ppp-step-nav__button--complete" : ""} ${isDisabled ? "ppp-step-nav__button--disabled" : ""}`}
                onClick={handleClick}
                disabled={isDisabled}
                aria-current={isActive ? "step" : undefined}
                aria-disabled={isDisabled || undefined}
                tabIndex={isDisabled ? -1 : 0}
              >
                <span className="ppp-step-nav__indicator">
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3.5 8.5l3 3 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isDisabled ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="12"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <span className="ppp-step-nav__content">
                  <span className="ppp-step-nav__label">{step.label}</span>
                  {step.count !== undefined && (
                    <span className="ppp-step-nav__count">{step.count}</span>
                  )}
                  {step.subtitle && (
                    <span className="ppp-step-nav__subtitle">
                      {step.subtitle}
                    </span>
                  )}
                </span>
                {step.badge && (
                  <span
                    className={`ppp-step-nav__badge ppp-step-nav__badge--${step.badge.type || "default"}`}
                  >
                    {step.badge.label}
                  </span>
                )}
                {isDisabled && step.requires && (
                  <span
                    className="ppp-step-nav__gate"
                    title={
                      typeof step.requires === "string"
                        ? `Requires: ${step.requires}`
                        : `Requires: ${step.requires.label}${step.requires.reason ? ` — ${step.requires.reason}` : ""}`
                    }
                    aria-label={
                      typeof step.requires === "string"
                        ? `Requires: ${step.requires}`
                        : `Requires: ${step.requires.label}`
                    }
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8 5v3M8 10.5v.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

StepNavigation.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      count: PropTypes.number,
      status: PropTypes.oneOf(["pending", "active", "complete"]),
      disabled: PropTypes.bool,
      requires: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          isMet: PropTypes.bool,
          reason: PropTypes.string,
        }),
      ]),
      badge: PropTypes.shape({
        type: PropTypes.oneOf([
          "success",
          "warning",
          "danger",
          "info",
          "default",
        ]),
        label: PropTypes.string,
      }),
    }),
  ).isRequired,
  activeStep: PropTypes.string,
  onStepClick: PropTypes.func,
  onLockedStepClick: PropTypes.func, // Called with requires object when locked step is tapped
  disabled: PropTypes.bool,
};

/**
 * MobileBottomBar - Sticky bottom action bar for mobile
 */
export function MobileBottomBar({ primaryAction, secondaryAction, stepInfo }) {
  return (
    <div className="ppp-mobile-bar">
      {stepInfo && (
        <div className="ppp-mobile-bar__info">
          <span className="ppp-mobile-bar__step">
            {stepInfo.current}/{stepInfo.total}
          </span>
          <span className="ppp-mobile-bar__label">{stepInfo.label}</span>
        </div>
      )}
      <div className="ppp-mobile-bar__actions">
        {secondaryAction}
        {primaryAction}
      </div>
    </div>
  );
}

MobileBottomBar.propTypes = {
  primaryAction: PropTypes.node,
  secondaryAction: PropTypes.node,
  stepInfo: PropTypes.shape({
    current: PropTypes.number,
    total: PropTypes.number,
    label: PropTypes.string,
  }),
};

export default AppShell;
