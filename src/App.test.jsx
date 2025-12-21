// @ts-nocheck
// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import App from "./App.jsx";

let prevIO;

beforeAll(() => {
  prevIO = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {
      /* no-op */
    }
    unobserve() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
    root = null;
    rootMargin = "";
    thresholds = [];
    takeRecords() {
      return [];
    }
  };
});

afterAll(() => {
  globalThis.IntersectionObserver = prevIO;
});

describe("App", () => {
  it("renders app chrome with new workflow UI", async () => {
    render(<App />);

    // New UI: PolePlan Pro header with job selector and help
    const polePlanElements = screen.getAllByText(/PolePlan Pro/i);
    expect(polePlanElements.length).toBeGreaterThan(0);

    // Check for Help button in header
    expect(screen.getByRole("button", { name: /Help/i })).toBeTruthy();

    // Check for navigation - step navigation should be present
    expect(screen.getByRole("navigation", { name: /Workflow/i })).toBeTruthy();
  });
});
