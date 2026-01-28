import { query } from "../db/client.js";
import { ValidationError } from "../utils/errors.js";

export async function listComments({ projectId }) {
  const { rows } = await query(
    `SELECT c.*, u.display_name AS author_name
       FROM comments c
       LEFT JOIN users u ON u.id = c.author_id
      WHERE c.project_id = $1
      ORDER BY c.created_at DESC`,
    [projectId],
  );
  return rows;
}

export async function addComment({
  projectId,
  authorId,
  body,
  entityType = "project",
  entityId,
}) {
  if (!body) throw new ValidationError("Comment body required");
  const { rows } = await query(
    `INSERT INTO comments (project_id, author_id, entity_type, entity_id, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [projectId, authorId || null, entityType, entityId || null, body],
  );
  return rows[0];
}
