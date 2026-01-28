// @ts-nocheck
import { describe, test, expect, beforeEach, vi } from "vitest";

// Mock JWT verification
const mockJwtVerify = vi.fn();
vi.mock("jsonwebtoken", () => ({
  verify: mockJwtVerify,
  sign: vi.fn(() => "mock-token"),
}));

// Simple auth middleware for testing
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = mockJwtVerify(token, "test-secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

describe("Authentication Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };
    next = vi.fn();
    mockJwtVerify.mockClear();
  });

  test("should reject request without authorization header", () => {
    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No authorization header" });
    expect(next).not.toHaveBeenCalled();
  });

  test("should reject request with malformed authorization header", () => {
    req.headers.authorization = "InvalidHeader";

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  test("should accept request with valid token", () => {
    const mockUser = { id: 1, email: "test@example.com", role: "user" };
    mockJwtVerify.mockReturnValue(mockUser);
    req.headers.authorization = "Bearer valid-token";

    authenticateJWT(req, res, next);

    expect(mockJwtVerify).toHaveBeenCalledWith("valid-token", "test-secret");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should reject request with invalid token", () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("Invalid token");
    });
    req.headers.authorization = "Bearer invalid-token";

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });
});
