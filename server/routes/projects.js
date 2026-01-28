/**
 * Projects API Routes - User-specific project data handling
 * Implements user data isolation and optional client partitioning
 */

import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../services/db.js";
import { validatePoleCoordinates } from "../../src/utils/gisValidation.js";

const router = express.Router();

// Use the existing authMiddleware instead of a separate authenticate function
const authenticate = authMiddleware;

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 * Query params:
 *   - organization_id: Filter by organization
 *   - client_id: Filter by client
 *   - search: Search in project name (case-insensitive)
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *   - sort: Sort field (name, created_at, updated_at)
 *   - order: Sort order (asc, desc)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const { user } = req;
    const {
      organization_id,
      client_id,
      search,
      page = 1,
      limit = 50,
      sort = "updated_at",
      order = "desc",
    } = req.query;

    // Validate and sanitize pagination params
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Validate sort params
    const allowedSortFields = ["name", "created_at", "updated_at"];
    const sortField = allowedSortFields.includes(sort) ? sort : "updated_at";
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Build WHERE clause
    let whereConditions = ["user_id = $1"];
    const params = [user.id];
    let paramIndex = 2;

    if (organization_id) {
      whereConditions.push(`organization_id = $${paramIndex}`);
      params.push(organization_id);
      paramIndex++;
    }

    if (client_id) {
      whereConditions.push(`client_id = $${paramIndex}`);
      params.push(client_id);
      paramIndex++;
    }

    if (search && search.trim()) {
      whereConditions.push(`name ILIKE $${paramIndex}`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination metadata
    const countQuery = `SELECT COUNT(*) FROM projects WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM projects 
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    const result = await db.query(dataQuery, params);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      projects: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 * Ensures user ownership before returning
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [id, user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    res.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
    });
  }
});

/**
 * POST /api/projects
 * Create a new project for the authenticated user
 * Validates GIS coordinates if provided
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { user } = req;
    const {
      name,
      description,
      project_data,
      organization_id,
      client_id,
      metadata,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Project name is required",
      });
    }

    // Validate GIS coordinates if present in project_data
    if (project_data?.poles && Array.isArray(project_data.poles)) {
      const validationErrors = [];

      for (const pole of project_data.poles) {
        if (pole.latitude || pole.longitude) {
          const validation = validatePoleCoordinates({
            id: pole.id || "unknown",
            latitude: pole.latitude,
            longitude: pole.longitude,
          });

          if (!validation.valid) {
            validationErrors.push({
              poleId: pole.id,
              errors: validation.errors,
            });
          }
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates detected",
          validationErrors,
        });
      }
    }

    // Create project
    const result = await db.query(
      `INSERT INTO projects (
        user_id, 
        organization_id, 
        client_id,
        name, 
        description, 
        project_data,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [
        user.id,
        organization_id || user.organization_id,
        client_id || null,
        name,
        description || null,
        JSON.stringify(project_data || {}),
        JSON.stringify(metadata || {}),
      ],
    );

    res.status(201).json({
      success: true,
      project: result.rows[0],
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update an existing project
 * Ensures user ownership and validates GIS coordinates
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { name, description, project_data, client_id, metadata } = req.body;

    // Check ownership
    const existingResult = await db.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [id, user.id],
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    // Validate GIS coordinates if present
    if (project_data?.poles && Array.isArray(project_data.poles)) {
      const validationErrors = [];

      for (const pole of project_data.poles) {
        if (pole.latitude || pole.longitude) {
          const validation = validatePoleCoordinates({
            id: pole.id || "unknown",
            latitude: pole.latitude,
            longitude: pole.longitude,
          });

          if (!validation.valid) {
            validationErrors.push({
              poleId: pole.id,
              errors: validation.errors,
            });
          }
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates detected",
          validationErrors,
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [id, user.id];
    let paramCount = 2;

    if (name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      params.push(description);
    }
    if (project_data !== undefined) {
      updates.push(`project_data = $${++paramCount}`);
      params.push(JSON.stringify(project_data));
    }
    if (client_id !== undefined) {
      updates.push(`client_id = $${++paramCount}`);
      params.push(client_id);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${++paramCount}`);
      params.push(JSON.stringify(metadata));
    }

    updates.push("updated_at = NOW()");

    const result = await db.query(
      `UPDATE projects SET ${updates.join(", ")}
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      params,
    );

    res.json({
      success: true,
      project: result.rows[0],
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 * Ensures user ownership before deletion
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
});

/**
 * POST /api/projects/:id/validate-coordinates
 * Validate all pole coordinates in a project
 * Returns validation report without saving
 */
router.post("/:id/validate-coordinates", authenticate, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Get project
    const result = await db.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [id, user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    const project = result.rows[0];
    const poles = project.project_data?.poles || [];

    if (!Array.isArray(poles) || poles.length === 0) {
      return res.json({
        success: true,
        report: {
          total: 0,
          valid: 0,
          invalid: 0,
          warnings: 0,
          poles: [],
        },
      });
    }

    // Validate each pole
    const validatedPoles = poles.map((pole) => {
      if (!pole.latitude && !pole.longitude) {
        return {
          id: pole.id,
          status: "skipped",
          reason: "No coordinates provided",
        };
      }

      const validation = validatePoleCoordinates({
        id: pole.id || "unknown",
        latitude: pole.latitude,
        longitude: pole.longitude,
      });

      return {
        id: pole.id,
        latitude: pole.latitude,
        longitude: pole.longitude,
        status: validation.valid ? "valid" : "invalid",
        errors: validation.errors || [],
        warnings: validation.warnings || [],
      };
    });

    const summary = {
      total: poles.length,
      valid: validatedPoles.filter((p) => p.status === "valid").length,
      invalid: validatedPoles.filter((p) => p.status === "invalid").length,
      warnings: validatedPoles.filter(
        (p) => p.warnings && p.warnings.length > 0,
      ).length,
      skipped: validatedPoles.filter((p) => p.status === "skipped").length,
    };

    res.json({
      success: true,
      report: {
        ...summary,
        poles: validatedPoles,
      },
    });
  } catch (error) {
    console.error("Error validating coordinates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate coordinates",
    });
  }
});

export { router as projectsRouter };
