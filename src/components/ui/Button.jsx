import React from "react";
import PropTypes from "prop-types";
import "./Button.css";

/**
 * Button component with multiple variants for the PolePlan Pro design system.
 * Supports primary, secondary, ghost, danger, and success variants.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) {
  const baseClass = "ppp-btn";
  const variantClass = `ppp-btn--${variant}`;
  const sizeClass = `ppp-btn--${size}`;
  const widthClass = fullWidth ? "ppp-btn--full" : "";
  const loadingClass = loading ? "ppp-btn--loading" : "";

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="ppp-btn__spinner" aria-hidden="true">
          <svg
            className="ppp-btn__spinner-icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.25"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      {icon && iconPosition === "left" && !loading && (
        <span className="ppp-btn__icon ppp-btn__icon--left">{icon}</span>
      )}
      <span className="ppp-btn__label">{children}</span>
      {icon && iconPosition === "right" && (
        <span className="ppp-btn__icon ppp-btn__icon--right">{icon}</span>
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "ghost",
    "danger",
    "success",
    "outline",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};

/**
 * IconButton for compact icon-only actions
 */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`ppp-icon-btn ppp-icon-btn--${variant} ppp-icon-btn--${size} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "danger"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
};

export default Button;
