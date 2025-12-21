import React from "react";
import PropTypes from "prop-types";
import "./Tooltip.css";

/**
 * Tooltip component for contextual help on technical fields.
 * Supports hover and focus activation.
 */
export function Tooltip({
  content,
  children,
  position = "top",
  delay = 200,
  className = "",
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <span
      className={`ppp-tooltip-wrapper ${className}`.trim()}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <span className={`ppp-tooltip ppp-tooltip--${position}`} role="tooltip">
          <span className="ppp-tooltip__content">{content}</span>
          <span className="ppp-tooltip__arrow" />
        </span>
      )}
    </span>
  );
}

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(["top", "bottom", "left", "right"]),
  delay: PropTypes.number,
  className: PropTypes.string,
};

/**
 * HelpTooltip - Convenience component for "?" help icons with tooltips
 */
export function HelpTooltip({ content, position = "top" }) {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className="ppp-help-icon"
        aria-label="More information"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6.5 6a1.5 1.5 0 1 1 2.12 1.37c-.4.27-.62.69-.62 1.13v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
      </button>
    </Tooltip>
  );
}

HelpTooltip.propTypes = {
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(["top", "bottom", "left", "right"]),
};

export default Tooltip;
