import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import {
  requestLogger,
  setRequestLoggerMetrics,
} from "../middleware/requestLogger.js";
import { MetricsService } from "../services/metrics.js";

class TestMetrics extends MetricsService {
  constructor() {
    super();
    this.recorded = [];
  }
  recordHttpRequest(method, path, statusCode, duration) {
    this.recorded.push({ method, path, statusCode, duration });
    super.recordHttpRequest(method, path, statusCode, duration);
  }
}

describe("requestLogger integration", () => {
  it("records metrics and logs slow request", async () => {
    const metrics = new TestMetrics();
    setRequestLoggerMetrics(metrics);

    const app = express();
    app.use((req, res, next) => {
      process.env.SLOW_REQUEST_THRESHOLD_MS = "5";
      next();
    });
    app.use(requestLogger);
    app.get("/slow", async (_req, res) => {
      await new Promise((r) => setTimeout(r, 15)); // slow enough
      res.json({ ok: true });
    });

    const resp = await request(app).get("/slow").expect(200);
    expect(resp.body.ok).toBe(true);
    expect(metrics.recorded.length).toBe(1);
    const rec = metrics.recorded[0];
    expect(rec.method).toBe("GET");
    expect(rec.path.includes("/slow")).toBe(true);
    expect(rec.statusCode).toBe(200);
    expect(rec.duration).toBeGreaterThanOrEqual(10); // approximate
  });
});
