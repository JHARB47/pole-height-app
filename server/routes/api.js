// @ts-nocheck
/**
 * Main API Routes
 * Core application API endpoints
 */
import express from "express";
import { apiKeysRouter } from "./apiKeys.js";
import { projectsRouter } from "./projects.js";
import { geospatialRouter } from "./geospatial.js";
import { calculationsRouter } from "./calculations.js";
import { rbacMiddleware } from "../middleware/rbac.js";
import { templatesRouter } from "./templates.js";

const router = express.Router();

// Mount sub-routers
router.use("/api-keys", apiKeysRouter);
router.use("/projects", projectsRouter);
router.use("/geospatial", geospatialRouter);
router.use("/calculations", calculationsRouter);
router.use("/templates", templatesRouter);

// User profile endpoints
router.get("/user/me", rbacMiddleware(["user"]), (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      preferences: user.preferences,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    },
  });
});

router.put("/user/me", rbacMiddleware(["user"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, timezone, preferences } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      updateValues.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      updateValues.push(last_name);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone);
    }

    if (timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      updateValues.push(timezone);
    }

    if (preferences !== undefined) {
      updateFields.push(`preferences = $${paramIndex++}`);
      updateValues.push(JSON.stringify(preferences));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: "No fields to update",
        code: "NO_UPDATES",
      });
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, email, first_name, last_name, phone, timezone, preferences, updated_at
    `;

    const db = req.app.locals.db;
    const result = await db.query(query, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    res.status(500).json({
      error: "Profile update failed",
      code: "UPDATE_FAILED",
    });
  }
});

// Organization endpoints for admins
router.get("/organization", rbacMiddleware(["admin"]), async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return res.status(404).json({
        error: "No organization found",
        code: "NO_ORGANIZATION",
      });
    }

    const db = req.app.locals.db;
    const orgResult = await db.query(
      "SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL",
      [organizationId],
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({
        error: "Organization not found",
        code: "ORG_NOT_FOUND",
      });
    }

    // Get organization users count
    const usersResult = await db.query(
      "SELECT COUNT(*) as user_count FROM users WHERE organization_id = $1 AND deleted_at IS NULL",
      [organizationId],
    );

    const organization = orgResult.rows[0];
    organization.user_count = parseInt(usersResult.rows[0].user_count);

    res.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Failed to fetch organization:", error);
    res.status(500).json({
      error: "Failed to fetch organization",
      code: "FETCH_FAILED",
    });
  }
});

export { router as apiRouter };
