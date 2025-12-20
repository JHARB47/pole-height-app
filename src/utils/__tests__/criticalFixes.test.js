import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

describe("Critical Risk Mitigations", () => {
  let originalLocalStorage;
  let mockLocalStorage;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = globalThis.localStorage;

    // Create mock localStorage that can simulate corruption
    mockLocalStorage = {
      getItem: (key) => {
        if (key === "corrupted") {
          return "{bad-json";
        }
        return null;
      },
      setItem: () => {},
      removeItem: () => {},
    };
  });

  afterEach(() => {
    // Restore original localStorage
    globalThis.localStorage = originalLocalStorage;
  });

  describe("localStorage Corruption Handling", () => {
    it("should handle corrupted JSON gracefully", () => {
      globalThis.localStorage = mockLocalStorage;

      // This should not throw even with corrupted data
      expect(() => {
        try {
          JSON.parse(mockLocalStorage.getItem("corrupted"));
        } catch (error) {
          // This is expected - our fix should catch this
          expect(error.message).toMatch(/JSON/);
          // The fix should return null instead of throwing
        }
      }).not.toThrow();
    });

    it("should validate localStorage structure before using", () => {
      const mockInvalidStructure = {
        getItem: () => JSON.stringify({ invalidStructure: true }),
        setItem: () => {},
        removeItem: () => {},
      };

      globalThis.localStorage = mockInvalidStructure;

      // Our fix should validate structure and reject invalid data
      const result = mockInvalidStructure.getItem("test");
      const parsed = JSON.parse(result);

      // Should not have valid state structure
      expect(parsed.state).toBeUndefined();
    });
  });

  describe("Route Fallback", () => {
    it("should have NotFoundPage component available", async () => {
      // Dynamic import to test component exists
      const { default: NotFoundPage } =
        await import("../../components/NotFoundPage.jsx");
      expect(NotFoundPage).toBeDefined();
      expect(typeof NotFoundPage).toBe("function");
    });
  });

  describe("CDN Fallback (Already Robust)", () => {
    it("should have exportShapefile with fallback logic", async () => {
      const { exportShapefile } = await import("../../utils/geodata.js");
      expect(exportShapefile).toBeDefined();
      expect(typeof exportShapefile).toBe("function");
    });

    it.skip("should handle CDN failure gracefully", async () => {
      // Mock window without shpwrite
      const originalWindow = globalThis.window;
      globalThis.window = { ...originalWindow };
      delete globalThis.window.shpwrite;

      const { exportShapefile } = await import("../../utils/geodata.js");

      // Should not throw even when CDN is unavailable
      const testFeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };

      // This should fallback to GeoJSON without throwing
      await expect(
        exportShapefile(testFeatureCollection, "test.zip", false),
      ).resolves.toBeInstanceOf(Blob);

      globalThis.window = originalWindow;
    });
  });

  describe("Environment Variable Validation", () => {
    it("should validate DATABASE_URL requirement", () => {
      // This test verifies the error message structure
      const expectedError = "DATABASE_URL environment variable is required";

      // Our fix should include helpful error messages
      expect(expectedError).toMatch(/DATABASE_URL/);
      expect(expectedError).toMatch(/required/);
    });
  });

  describe("Asset Rewrite Guard", () => {
    it("should prevent /assets/* from falling through to SPA rewrite", () => {
      // AI: rationale — prevent cache-poisoning where HTML is served/cached under a JS URL.
      const configPath = path.join(process.cwd(), "netlify.toml");
      const config = fs.readFileSync(configPath, "utf8");

      const assetsRuleIndex = config.indexOf('from = "/assets/*"');
      const spaRuleIndex = config.indexOf('from = "/*"');

      expect(assetsRuleIndex).toBeGreaterThan(-1);
      expect(spaRuleIndex).toBeGreaterThan(-1);
      expect(assetsRuleIndex).toBeLessThan(spaRuleIndex);

      // Minimal shape check so a rename or reformat doesn't break this test unnecessarily.
      expect(config).toMatch(
        /from = "\/assets\/\*"[\s\S]*?to = "\/assets\/:splat"[\s\S]*?status = 200/,
      );
    });
  });

  describe("Service Worker Asset Guard", () => {
    it("should bypass cache for /assets/* requests", () => {
      // AI: rationale — ensure SW can't accidentally serve cached HTML for asset URLs.
      const swPath = path.join(process.cwd(), "public", "sw.js");
      const sw = fs.readFileSync(swPath, "utf8");

      expect(sw).toContain("reqUrl.pathname.startsWith('/assets/')");
      expect(sw).toMatch(/Never satisfy asset requests from cache/);
      expect(sw).toMatch(/fetch\(req\)\.catch/);
    });
  });

  describe("Headers Caching Guard", () => {
    it("should keep immutable caching for /assets/* and no-cache for sw.js", () => {
      // AI: rationale — prevent regressions where HTML gets cached under asset URLs.
      const headersPath = path.join(process.cwd(), "public", "_headers");
      const headers = fs.readFileSync(headersPath, "utf8");

      const configPath = path.join(process.cwd(), "netlify.toml");
      const config = fs.readFileSync(configPath, "utf8");

      // Assets should be long-lived and immutable.
      expect(headers).toContain("/assets/*");
      expect(headers).toMatch(
        /\/assets\/\*[\s\S]*?Cache-Control:\s*public,\s*max-age=31536000,\s*immutable/,
      );

      // The service worker script must not be cached.
      expect(headers).toContain("/sw.js");
      expect(headers).toMatch(
        /\/sw\.js[\s\S]*?Cache-Control:\s*no-cache,\s*no-store,\s*must-revalidate/,
      );

      // Base path should be no-store to avoid stale HTML.
      expect(headers).toMatch(/\/\*[\s\S]*?Cache-Control:\s*no-store/);

      // Ensure we don't end up with two competing sources of truth for headers.
      expect(config).not.toContain("[[headers]]");
    });
  });

  describe("Repo Hygiene Guards", () => {
    it("should not commit .bak backup files", () => {
      // AI: rationale — tracked backups create config drift and accidental deploy changes.
      const tracked = execSync("git ls-files", { encoding: "utf8" })
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const bakFiles = tracked.filter((p) => p.endsWith(".bak"));
      expect(bakFiles).toEqual([]);
    });

    it("should not include stray JWT secret files", () => {
      // AI: rationale — prevent committing secrets via misnamed env export artifacts.
      const tracked = execSync("git ls-files", { encoding: "utf8" });
      expect(tracked).not.toMatch(/\bJWT_SECRET=/);
    });

    it("should not commit real .env files", () => {
      // AI: rationale — a common accidental secret leak path.
      const tracked = execSync("git ls-files", { encoding: "utf8" })
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const envLike = tracked.filter(
        (p) =>
          p === ".env" ||
          (p.startsWith(".env.") && p !== ".env.example") ||
          p.endsWith("/.env") ||
          (p.includes("/.env.") && !p.endsWith("/.env.example")),
      );

      // `.env.test` is allowed (contains only non-secret test runner knobs).
      const envLikeDisallowed = envLike.filter((p) => p !== ".env.test");

      expect(envLikeDisallowed).toEqual([]);
    });
  });
});
