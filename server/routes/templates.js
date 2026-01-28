// @ts-nocheck
import express from "express";
import { rbacMiddleware } from "../middleware/rbac.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

const router = express.Router();

function assertOrg(req) {
  const orgId = req.user?.organization_id;
  if (!orgId) {
    throw new ValidationError("Organization context required");
  }
  return orgId;
}

router.get("/", rbacMiddleware(["user"]), async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const orgId = assertOrg(req);
    const query = `
      SELECT t.*, COALESCE(tv.version, 0) AS latest_version, tv.created_at AS latest_version_created
      FROM templates t
      LEFT JOIN LATERAL (
        SELECT version, created_at
        FROM template_versions tv
        WHERE tv.template_id = t.id
        ORDER BY version DESC
        LIMIT 1
      ) tv ON true
      WHERE (t.organization_id = $1 OR t.sharing_mode IN ('public','link'))
        AND t.deleted_at IS NULL
      ORDER BY t.updated_at DESC
    `;
    const { rows } = await db.query(query, [orgId]);
    res.json({ success: true, templates: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", rbacMiddleware(["user"]), async (req, res, next) => {
  const db = req.app.locals.db;
  const orgId = assertOrg(req);
  const userId = req.user.id;
  const {
    name,
    description,
    sharing_mode = "private",
    tags = [],
    payload,
    metadata = {},
    category_slug,
  } = req.body || {};

  if (!name || !payload) {
    return next(new ValidationError("Template name and payload are required"));
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    let categoryId = null;
    if (category_slug) {
      const cat = await client.query(
        "SELECT id FROM template_categories WHERE slug = $1 AND (organization_id = $2 OR is_builtin = true)",
        [category_slug, orgId],
      );
      if (cat.rows[0]) {
        categoryId = cat.rows[0].id;
      }
    }

    const templateInsert = await client.query(
      `INSERT INTO templates (organization_id, owner_id, category_id, name, description, sharing_mode, tags, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        orgId,
        userId,
        categoryId,
        name,
        description,
        sharing_mode,
        tags,
        metadata,
      ],
    );

    const template = templateInsert.rows[0];

    const versionInsert = await client.query(
      `INSERT INTO template_versions (template_id, version, payload, created_by)
       VALUES ($1, 1, $2, $3)
       RETURNING *`,
      [template.id, payload, userId],
    );

    await client.query(
      "UPDATE templates SET latest_version = $1 WHERE id = $2",
      [versionInsert.rows[0].version, template.id],
    );

    await client.query("COMMIT");
    res
      .status(201)
      .json({ success: true, template, version: versionInsert.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.get("/:templateId", rbacMiddleware(["user"]), async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const orgId = assertOrg(req);
    const { templateId } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM templates WHERE id = $1 AND (organization_id = $2 OR sharing_mode IN ('public','link')) AND deleted_at IS NULL`,
      [templateId, orgId],
    );

    if (!rows[0]) {
      throw new NotFoundError("Template not found");
    }

    const versions = await db.query(
      `SELECT * FROM template_versions WHERE template_id = $1 ORDER BY version DESC`,
      [templateId],
    );

    res.json({ success: true, template: rows[0], versions: versions.rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:templateId/versions",
  rbacMiddleware(["user"]),
  async (req, res, next) => {
    const db = req.app.locals.db;
    const { templateId } = req.params;
    const { payload, notes } = req.body || {};
    const userId = req.user.id;

    if (!payload) {
      return next(new ValidationError("Payload is required"));
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const templateResult = await client.query(
        `SELECT organization_id, latest_version FROM templates WHERE id = $1 AND deleted_at IS NULL`,
        [templateId],
      );

      if (!templateResult.rows[0]) {
        throw new NotFoundError("Template not found");
      }

      const { organization_id: templateOrg, latest_version } =
        templateResult.rows[0];
      if (templateOrg && templateOrg !== req.user.organization_id) {
        throw new ValidationError(
          "Cannot modify template outside your organization",
        );
      }

      const nextVersion = (latest_version || 0) + 1;

      const versionInsert = await client.query(
        `INSERT INTO template_versions (template_id, version, payload, notes, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
        [templateId, nextVersion, payload, notes || null, userId],
      );

      await client.query(
        "UPDATE templates SET latest_version = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [nextVersion, templateId],
      );

      await client.query("COMMIT");
      res.status(201).json({ success: true, version: versionInsert.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  },
);

router.patch(
  "/:templateId",
  rbacMiddleware(["user"]),
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { templateId } = req.params;
      const { name, description, sharing_mode, tags, metadata } =
        req.body || {};
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push(`name = $${updates.length + 1}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${updates.length + 1}`);
        values.push(description);
      }
      if (sharing_mode !== undefined) {
        updates.push(`sharing_mode = $${updates.length + 1}`);
        values.push(sharing_mode);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${updates.length + 1}`);
        values.push(tags);
      }
      if (metadata !== undefined) {
        updates.push(`metadata = $${updates.length + 1}`);
        values.push(metadata);
      }

      if (!updates.length) {
        throw new ValidationError("No updates provided");
      }

      values.push(templateId, req.user.organization_id || null);

      const query = `
      UPDATE templates
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${updates.length + 1} AND (organization_id = $${updates.length + 2} OR sharing_mode IN ('public','link'))
      RETURNING *
    `;

      const { rows } = await db.query(query, values);
      if (!rows[0]) {
        throw new NotFoundError("Template not found");
      }

      res.json({ success: true, template: rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

export { router as templatesRouter };
