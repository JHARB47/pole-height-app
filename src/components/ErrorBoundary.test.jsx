import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary.jsx";

function Boom() {
  throw new Error("Boom!");
}

describe("ErrorBoundary", () => {
  /** @type {ReturnType<typeof vi.spyOn> | undefined} */
  let consoleErrorSpy;

  beforeEach(() => {
    // React logs the error + stack when an error boundary catches; this is expected in this test.
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => {
        const msg = String(args[0] ?? "");
        if (
          msg.includes("Error: Boom!") ||
          msg.includes("The above error occurred")
        )
          return;
      });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = undefined;
  });

  it("renders fallback on child error", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
    expect(screen.getByText(/Boom!/i)).toBeTruthy();
  });
});
