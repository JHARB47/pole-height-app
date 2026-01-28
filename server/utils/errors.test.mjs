import { describe, it, expect } from "vitest";
import {
  HttpError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  isHttpError,
} from "./errors.js";

describe("server/utils/errors", () => {
  it("creates specific HttpError subclasses with correct status codes", () => {
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new NotFoundError().status).toBe(404);

    const validation = new ValidationError("Bad data", { field: "value" });
    expect(validation.status).toBe(400);
    expect(validation.details).toEqual({ field: "value" });
  });

  it("detects HttpError instances via isHttpError helper", () => {
    const err = new HttpError(418, "I'm a teapot");
    expect(isHttpError(err)).toBe(true);
    expect(isHttpError({ status: 500 })).toBe(true);
    expect(isHttpError(new Error("nope"))).toBe(false);
    expect(isHttpError(null)).toBe(false);
  });
});
