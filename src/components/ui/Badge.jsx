import React from "react";
import PropTypes from "prop-types";
import "./Badge.css";

/**
 * Badge component for status indicators, counts, and labels.
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  ...props
}) {
  return (
    <span
      className={`ppp-badge ppp-badge--${variant} ppp-badge--${size} ${dot ? "ppp-badge--dot" : ""} ${className}`.trim()}
      {...props}
    >
      {dot && <span className="ppp-badge__dot" />}
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "default",
    "primary",
    "success",
    "warning",
    "danger",
    "info",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  dot: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * StatusBadge - Pre-configured badge for common statuses
 */
export function StatusBadge({ status }) {
  const config = {
    pass: { variant: "success", label: "PASS" },
    fail: { variant: "danger", label: "FAIL" },
    warning: { variant: "warning", label: "WARNING" },
    draft: { variant: "default", label: "DRAFT" },
    done: { variant: "success", label: "DONE" },
    pending: { variant: "warning", label: "PENDING" },
    complete: { variant: "success", label: "COMPLETE" },
    incomplete: { variant: "danger", label: "INCOMPLETE" },
    disabled: { variant: "default", label: "DISABLED" },
    active: { variant: "primary", label: "ACTIVE" },
  };

  const { variant, label } = config[status] || config.default;

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf([
    "pass",
    "fail",
    "warning",
    "draft",
    "done",
    "pending",
    "complete",
    "incomplete",
    "disabled",
    "active",
  ]).isRequired,
};

/**
 * CountBadge - Badge for displaying counts
 */
export function CountBadge({ count, max = 99, variant = "primary" }) {
  const displayCount = count > max ? `${max}+` : count;

  if (count === 0) return null;

  return (
    <Badge variant={variant} size="sm">
      {displayCount}
    </Badge>
  );
}

CountBadge.propTypes = {
  count: PropTypes.number.isRequired,
  max: PropTypes.number,
  variant: PropTypes.oneOf([
    "default",
    "primary",
    "success",
    "warning",
    "danger",
    "info",
  ]),
};

export default Badge;
