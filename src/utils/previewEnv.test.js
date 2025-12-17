import { describe, it, expect } from "vitest";
import { computeIsPreviewHost, computeHideAuthButtons } from "./previewEnv.js";

describe("previewEnv helpers", () => {
  it("detects Netlify branch deploy host", () => {
    const host = "feature-x--poleplanpro.netlify.app";
    expect(
      computeIsPreviewHost(host, "poleplanpro.com", "poleplanpro.netlify.app"),
    ).toBe(true);
  });

  it("detects custom branch subdomain under primary domain", () => {
    const host = "pr-123.poleplanpro.com";
    expect(
      computeIsPreviewHost(host, "poleplanpro.com", "poleplanpro.netlify.app"),
    ).toBe(true);
  });

  it("does not treat apex as preview host", () => {
    const host = "poleplanpro.com";
    expect(
      computeIsPreviewHost(host, "poleplanpro.com", "poleplanpro.netlify.app"),
    ).toBe(false);
  });

  it("hides auth buttons only when preview auth is disabled and host is preview", () => {
    const host = "branch--poleplanpro.netlify.app";
    expect(
      computeHideAuthButtons(
        host,
        true,
        "poleplanpro.com",
        "poleplanpro.netlify.app",
      ),
    ).toBe(true);
    expect(
      computeHideAuthButtons(
        host,
        false,
        "poleplanpro.com",
        "poleplanpro.netlify.app",
      ),
    ).toBe(false);
  });
});
