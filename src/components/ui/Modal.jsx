import React from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import "./Modal.css";

/**
 * Modal component for dialogs, confirmations, and help content.
 * Supports accessible keyboard navigation and focus trapping.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  className = "",
}) {
  const modalRef = React.useRef(null);
  const previousFocus = React.useRef(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Handle escape key
  React.useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  // Focus trapping within modal
  React.useEffect(() => {
    if (!open) return;

    const modal = modalRef.current;
    if (!modal) return;

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    modal.addEventListener("keydown", handleTabKey);
    return () => modal.removeEventListener("keydown", handleTabKey);
  }, [open]);

  // Focus management
  React.useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      // Delay focus to ensure modal is rendered
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      previousFocus.current?.focus?.();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div className="ppp-modal__backdrop" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`ppp-modal ppp-modal--${size} ${className}`.trim()}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="ppp-modal__header">
            <div className="ppp-modal__header-content">
              {title && (
                <h2 id={titleId} className="ppp-modal__title">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="ppp-modal__description">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="ppp-modal__close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="ppp-modal__body">{children}</div>
        {footer && <div className="ppp-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "full"]),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  footer: PropTypes.node,
  className: PropTypes.string,
};

/**
 * Confirmation Modal for destructive actions
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="ppp-modal__footer-actions">
          <button
            type="button"
            className="ppp-btn ppp-btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`ppp-btn ppp-btn--${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="ppp-modal__message">{message}</p>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(["danger", "primary", "warning"]),
  loading: PropTypes.bool,
};

export default Modal;
