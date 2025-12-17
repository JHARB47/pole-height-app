// Vitest setup: testing-library cleanup and light DOM shims
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  // AI: rationale — wrap cleanup to avoid concurrent React work errors while still resetting DOM
  try {
    cleanup();
  } catch (err) {
    const message = err?.message || "";
    if (message.includes("Should not already be working")) {
      // swallow noisy concurrent cleanup edge in tests
      return;
    }
    throw err;
  } finally {
    // reset timers to avoid leaking fake timers across tests
    if (typeof vi?.useRealTimers === "function") {
      vi.useRealTimers();
    }
  }
});

// Mock matchMedia if not present (jsdom)
if (typeof window !== "undefined" && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Polyfill Blob.prototype.text if missing (jsdom older versions)
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
  // @ts-ignore
  Blob.prototype.text = function () {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(this);
    });
  };
}
