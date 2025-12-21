import React from "react";
import { WorkflowApp } from "./components/workflow";
import "./styles/design-tokens.css";
import "./styles/globals.css";

/**
 * App - Root application component.
 *
 * The application now uses the redesigned WorkflowApp with:
 * - AppShell layout (header + sidebar + main content)
 * - Step-based navigation
 * - Persistent Help modal with first-run onboarding
 * - Design tokens for consistent theming
 *
 * The legacy ProposedLineCalculator is still available at:
 * import LazyProposedLineCalculator from "./components/LazyProposedLineCalculator"
 */
export default function App() {
  return <WorkflowApp />;
}
