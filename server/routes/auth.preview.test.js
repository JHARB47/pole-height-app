import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

let app;

describe("Preview auth gating", () => {
  const prevEnv = process.env.DISABLE_PREVIEW_AUTH;
  const prevSentry = process.env.DISABLE_SENTRY;

  beforeAll(async () => {
    process.env.DISABLE_PREVIEW_AUTH = "true";
    process.env.DISABLE_SENTRY = "true";
    const mod = await import("../index.js");
    app = mod.default;
  });

  afterAll(() => {
    process.env.DISABLE_PREVIEW_AUTH = prevEnv;
    process.env.DISABLE_SENTRY = prevSentry;
  });

  it("returns 403 on GitHub auth start for Netlify branch host when disabled", async () => {
    const res = await request(app)
      .get("/auth/github")
      .set("x-forwarded-host", "feature-x--poleplanpro.netlify.app")
      .expect(403);
    expect(res.body && res.body.code).toBe("PREVIEW_AUTH_DISABLED");
  });
});
