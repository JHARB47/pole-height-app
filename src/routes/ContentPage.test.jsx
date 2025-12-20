// @ts-nocheck
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import ContentPage from "./ContentPage.jsx";

function renderWithRoute(pathname) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <ContentPage slug="home" /> },
      { path: "/:slug", element: <ContentPage /> },
    ],
    { initialEntries: [pathname] },
  );
  render(<RouterProvider router={router} />);
}

describe("ContentPage", () => {
  /** @type {ReturnType<typeof vi.spyOn> | undefined} */
  let consoleWarnSpy;

  beforeEach(() => {
    // React Router emits a v7 future flag warning to stderr; it isn't actionable for this repo right now.
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation((...args) => {
      const msg = String(args[0] ?? "");
      if (msg.includes("React Router Future Flag Warning")) return;
    });
  });

  afterEach(() => {
    consoleWarnSpy?.mockRestore();
    consoleWarnSpy = undefined;
  });

  it("renders home content", () => {
    renderWithRoute("/");
    expect(document.title).toBe("Home");
    expect(
      screen.getByText(/OSP Engineering & Permit Management/i),
    ).toBeTruthy();
  });

  it("renders not found for unknown slug", () => {
    renderWithRoute("/nope");
    expect(
      screen.getByRole("heading", { name: /Page not found/i }),
    ).toBeTruthy();
  });
});
