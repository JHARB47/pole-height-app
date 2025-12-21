import React from "react";
import PropTypes from "prop-types";
import "./Card.css";

/**
 * Card component for boxed sections with header and content.
 * Used for workflow step panels and grouped content areas.
 */
export function Card({ children, className = "", padding = "md", ...props }) {
  return (
    <div
      className={`ppp-card ppp-card--padding-${padding} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.oneOf(["none", "sm", "md", "lg"]),
};

/**
 * Card Header with title, description, and action slot
 */
export function CardHeader({
  title,
  description,
  stepNumber,
  status,
  action,
  className = "",
}) {
  return (
    <div className={`ppp-card__header ${className}`.trim()}>
      <div className="ppp-card__header-content">
        <div className="ppp-card__title-row">
          {stepNumber && (
            <span className="ppp-card__step-badge">{stepNumber}</span>
          )}
          <h2 className="ppp-card__title">{title}</h2>
          {status && (
            <span
              className={`ppp-badge ppp-badge--${status.type || "default"}`}
            >
              {status.label}
            </span>
          )}
        </div>
        {description && <p className="ppp-card__description">{description}</p>}
      </div>
      {action && <div className="ppp-card__action">{action}</div>}
    </div>
  );
}

CardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  stepNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  status: PropTypes.shape({
    type: PropTypes.oneOf(["success", "warning", "danger", "info", "default"]),
    label: PropTypes.string,
  }),
  action: PropTypes.node,
  className: PropTypes.string,
};

/**
 * Card Body for main content area
 */
export function CardBody({ children, className = "" }) {
  return <div className={`ppp-card__body ${className}`.trim()}>{children}</div>;
}

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

/**
 * Card Section for grouping related content within a card
 */
export function CardSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`ppp-card__section ${className}`.trim()}>
      {title && (
        <div
          className={`ppp-card__section-header ${collapsible ? "ppp-card__section-header--collapsible" : ""}`}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
          role={collapsible ? "button" : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                  }
                }
              : undefined
          }
        >
          <h3 className="ppp-card__section-title">{title}</h3>
          {collapsible && (
            <svg
              className={`ppp-card__section-chevron ${isOpen ? "ppp-card__section-chevron--open" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
      {(!collapsible || isOpen) && (
        <div className="ppp-card__section-content">{children}</div>
      )}
    </div>
  );
}

CardSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  collapsible: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  className: PropTypes.string,
};

export default Card;
