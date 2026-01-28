import { describe, it, expect, beforeEach, vi } from "vitest";
import { ValidationError } from "../utils/errors.js";

vi.mock("../services/logger.js", () => {
  const errorSpy = vi.fn();
  const infoSpy = vi.fn();
  const warnSpy = vi.fn();

  class MockLogger {
    info = infoSpy;
    warn = warnSpy;
    error = errorSpy;
  }

  return {
    Logger: MockLogger,
    __getLoggerSpies: () => ({ errorSpy, infoSpy, warnSpy }),
  };
});

const { errorHandler } = await import("./errorHandler.js");
const { __getLoggerSpies } = await import("../services/logger.js");

function createReq(overrides = {}) {
  return {
    originalUrl: "/test",
    method: "GET",
    ip: "127.0.0.1",
    ...overrides,
  };
}

function createRes() {
  const res = {
    statusCode: 0,
    payload: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
    end: vi.fn(),
  };
  return res;
}

describe("errorHandler middleware", () => {
  beforeEach(() => {
    const { errorSpy, infoSpy, warnSpy } = __getLoggerSpies();
    errorSpy.mockClear();
    infoSpy.mockClear();
    warnSpy.mockClear();
  });

  it("sanitizes sensitive details for HttpError instances", () => {
    const err = new ValidationError("Invalid payload", {
      password: "hunter2",
      nested: { token: "abc", keep: "value" },
    });

    const req = createReq({ user: { id: "user-123" }, id: "req-1" });
    const res = createRes();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.payload).toMatchObject({
      error: "BadRequest",
      message: "Invalid payload",
      status: 400,
      requestId: "req-1",
      details: {
        password: "[REDACTED]",
        nested: { token: "[REDACTED]", keep: "value" },
      },
    });

    const { errorSpy } = __getLoggerSpies();
    expect(errorSpy).toHaveBeenCalledWith(
      "Request failed",
      err,
      expect.objectContaining({ status: 400, userId: "user-123" }),
    );
  });

  it("handles unexpected errors and includes stack traces in non-production", () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const err = new Error("kaboom");
    const req = createReq();
    const res = createRes();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(500);
    expect(res.payload.error).toBe("Internal");
    expect(res.payload.message).toBe("kaboom");
    expect(res.payload.stack).toBeDefined();

    process.env.NODE_ENV = previousEnv;
  });
});
