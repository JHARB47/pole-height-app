// @ts-nocheck
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";

// Mock authentication middleware and routes
const createAuthTestServer = () => {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  const mockAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token === "valid-token") {
      req.user = { id: 1, role: "admin", email: "test@example.com" };
    }
    next();
  };

  // Mock RBAC middleware
  const mockRBAC = (requiredRole) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.role !== requiredRole && requiredRole !== "any") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  // Auth routes
  app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
      res.json({
        token: "mock-jwt-token",
        user: { id: 1, email, role: "user" },
      });
    } else {
      res.status(400).json({ error: "Email and password required" });
    }
  });

  app.get("/auth/profile", mockAuth, mockRBAC("any"), (req, res) => {
    res.json({ user: req.user });
  });

  app.get("/admin/users", mockAuth, mockRBAC("admin"), (req, res) => {
    res.json({ users: [req.user] });
  });

  return app;
};

describe("Authentication", () => {
  let app;

  beforeAll(() => {
    app = createAuthTestServer();
  });

  test("POST /auth/login with valid credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200);

    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", "test@example.com");
  });

  test("POST /auth/login with missing credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty(
      "error",
      "Email and password required",
    );
  });

  test("GET /auth/profile with valid token", async () => {
    const response = await request(app)
      .get("/auth/profile")
      .set("Authorization", "Bearer valid-token")
      .expect(200);

    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id", 1);
  });

  test("GET /auth/profile without token", async () => {
    const response = await request(app).get("/auth/profile").expect(401);

    expect(response.body).toHaveProperty("error", "Unauthorized");
  });

  test("GET /admin/users with admin role", async () => {
    const response = await request(app)
      .get("/admin/users")
      .set("Authorization", "Bearer valid-token")
      .expect(200);

    expect(response.body).toHaveProperty("users");
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  test("GET /admin/users without token", async () => {
    const response = await request(app).get("/admin/users").expect(401);

    expect(response.body).toHaveProperty("error", "Unauthorized");
  });
});
