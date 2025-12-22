import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../ui/Modal";
import "./HelpModal.css";

const HELP_KEY = "ppp_help_seen";

/**
 * HelpModal - Persistent help modal with tabs for Quick Start, Field Mode Tips, and FAQ.
 * Auto-opens on first visit using localStorage.
 */
export function HelpModal({ open, onClose }) {
  const [activeTab, setActiveTab] = React.useState("quickstart");
  const [dontShowAgain, setDontShowAgain] = React.useState(true);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(HELP_KEY, "1");
      } catch {
        // Ignore storage errors
      }
    }
    onClose?.();
  };

  const tabs = [
    { id: "quickstart", label: "Quick Start" },
    { id: "fieldmode", label: "Field Mode Tips" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="PolePlan Pro Help"
      description="Learn how to use the OSP permitting workflow"
      size="lg"
      footer={
        <div className="ppp-help-footer">
          <label className="ppp-help-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don't show on startup</span>
          </label>
          <button
            type="button"
            className="ppp-btn ppp-btn--primary"
            onClick={handleClose}
          >
            Got it
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="ppp-modal__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ppp-modal__tab ${activeTab === tab.id ? "ppp-modal__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="ppp-modal__tab-panel">
        {activeTab === "quickstart" && <QuickStartTab />}
        {activeTab === "fieldmode" && <FieldModeTab />}
        {activeTab === "faq" && <FAQTab />}
      </div>
    </Modal>
  );
}

HelpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

/**
 * Quick Start Tab - 6-step workflow summary
 */
function QuickStartTab() {
  const steps = [
    {
      number: 1,
      title: "Project Setup",
      description:
        "Configure job metadata, utility owner, and submission profile. Set your pole height and standards.",
      icon: "📋",
    },
    {
      number: 2,
      title: "Data Intake",
      description:
        "Import pole data from CSV, KML, or Shapefile. Map columns using presets for ArcGIS, ikeGPS, or Katapult Pro.",
      icon: "📁",
    },
    {
      number: 3,
      title: "Existing Plant",
      description:
        "Review and edit existing attachments. Add make-ready notes where needed.",
      icon: "⚡",
    },
    {
      number: 4,
      title: "Span Modeling",
      description:
        "Configure span environments and compute clearances. Review auto-calculated lengths from GPS coordinates.",
      icon: "📏",
    },
    {
      number: 5,
      title: "Field Collection",
      description:
        "Capture photos and GPS coordinates per pole. Mark poles as Draft or Done.",
      icon: "📍",
    },
    {
      number: 6,
      title: "Outputs",
      description:
        "Generate permit reports, export to FirstEnergy format, download GeoJSON/KML/Shapefile.",
      icon: "📊",
    },
  ];

  return (
    <div className="ppp-help-quickstart">
      <p className="ppp-help-intro">
        Follow these six steps to complete your OSP/joint-use permitting
        workflow:
      </p>
      <div className="ppp-help-steps">
        {steps.map((step) => (
          <div key={step.number} className="ppp-help-step">
            <div className="ppp-help-step__icon">{step.icon}</div>
            <div className="ppp-help-step__content">
              <h4 className="ppp-help-step__title">
                <span className="ppp-help-step__number">{step.number}.</span>
                {step.title}
              </h4>
              <p className="ppp-help-step__desc">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Field Mode Tips Tab
 */
function FieldModeTab() {
  const tips = [
    {
      title: "GPS Capture",
      description:
        'Use the "Use GPS" button to capture device coordinates. Ensure location services are enabled.',
      icon: "📍",
    },
    {
      title: "Photo Documentation",
      description:
        "Take clear photos of the pole, existing attachments, and any make-ready work needed.",
      icon: "📷",
    },
    {
      title: "Draft vs Done",
      description:
        'Mark poles as "Draft" while collecting data. Change to "Done" when all info is captured.',
      icon: "✅",
    },
    {
      title: "Export First 25 FE Spans",
      description:
        "For FirstEnergy submissions, export the first 25 spans using the FE Joint Use CSV format.",
      icon: "📤",
    },
    {
      title: "Offline Support",
      description:
        "Data saves locally. Changes persist even if you lose connection.",
      icon: "💾",
    },
  ];

  return (
    <div className="ppp-help-fieldmode">
      <p className="ppp-help-intro">
        Tips for efficient field data collection:
      </p>
      <div className="ppp-help-tips">
        {tips.map((tip, index) => (
          <div key={index} className="ppp-help-tip">
            <span className="ppp-help-tip__icon">{tip.icon}</span>
            <div className="ppp-help-tip__content">
              <h4 className="ppp-help-tip__title">{tip.title}</h4>
              <p className="ppp-help-tip__desc">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * FAQ Tab
 */
function FAQTab() {
  const faqs = [
    {
      question: "What file formats can I import?",
      answer:
        "CSV, KML, KMZ, GeoJSON, and Shapefile (.shp with .dbf). Use WGS84 (EPSG:4326) coordinates for best results.",
    },
    {
      question: "How do I use mapping presets?",
      answer:
        "When importing, select a preset (ArcGIS, ikeGPS, Katapult Pro) to auto-map columns. You can also save custom mappings.",
    },
    {
      question: 'What is the 44" Comm-to-Power rule?',
      answer:
        'FirstEnergy subsidiaries require 44" minimum separation between communication attachments and power. Select the appropriate FE submission profile.',
    },
    {
      question: "How do I generate a permit pack?",
      answer:
        'In the Outputs step, click "Generate Permit" to create a comprehensive report with all pole data, calculations, and compliance status.',
    },
    {
      question: "What does the Δ (delta) threshold mean?",
      answer:
        "Delta shows the difference between auto-calculated span length (from GPS) and manual entry. Configure the threshold to highlight significant discrepancies.",
    },
    {
      question: "How do I reset/clear my data?",
      answer:
        'Use the "Clear" button in the relevant section, or visit Settings to reset all data. This action is irreversible.',
    },
  ];

  const [openIndex, setOpenIndex] = React.useState(0);

  return (
    <div className="ppp-help-faq">
      <p className="ppp-help-intro">Frequently asked questions:</p>
      <div className="ppp-help-faq__list">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`ppp-help-faq__item ${openIndex === index ? "ppp-help-faq__item--open" : ""}`}
          >
            <button
              type="button"
              className="ppp-help-faq__question"
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              aria-expanded={openIndex === index}
            >
              <span>{faq.question}</span>
              <svg
                className="ppp-help-faq__chevron"
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
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="ppp-help-faq__answer">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HelpModal;
