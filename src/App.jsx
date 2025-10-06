import React from "react";
import LazyProposedLineCalculator from "./components/LazyProposedLineCalculator";
import JobSetup from "./components/JobSetup";

export default function App() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        🏗️ OSP Engineering & Permit Management
      </h1>
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <p>System Status: ✅ Application Loading Successfully</p>
        <p>React Version: {React.version}</p>
      </div>
      <div className="safe-pt safe-pb">
        <div className="mx-auto max-w-6xl px-3 md:px-6 py-3 md:py-4 break-anywhere">
          <JobSetup />
          <div className="h-3" />
          <LazyProposedLineCalculator />
        </div>
      </div>
    </div>
  );
}
