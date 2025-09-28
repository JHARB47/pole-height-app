import { query, transaction } from '../db/client.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function listProjects({ organizationId, departmentId }) {
  const params = [organizationId];
  let clause = 'organization_id = $1';
  if (departmentId) {
    params.push(departmentId);
    clause += ' AND (department_id IS NULL OR department_id = $2)';
  }
  const { rows } = await query(
    `SELECT * FROM projects WHERE ${clause} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

export async function getProjectById(projectId, organizationId) {
  const { rows } = await query(
    `SELECT * FROM projects WHERE id = $1 AND organization_id = $2`,
    [projectId, organizationId]
  );
  return rows[0] || null;
}

export async function createProject({ organizationId, departmentId, name, status = 'draft', metadata = {}, creatorId }) {
  if (!name) throw new ValidationError('Project name is required');
  return transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO projects (organization_id, department_id, name, status, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [organizationId, departmentId || null, name, status, JSON.stringify(metadata)]
    );
    const project = rows[0];
    if (creatorId) {
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id)
         DO UPDATE SET role = EXCLUDED.role`,
        [project.id, creatorId, 'manager']
      );
    }
    return project;
  });
}

export async function updateProject({ projectId, organizationId, name, status, metadata }) {
  const updates = [];
  const params = [];
  let idx = 1;
  if (name) {
    updates.push(`name = $${idx++}`);
    params.push(name);
  }
  if (status) {
    updates.push(`status = $${idx++}`);
    params.push(status);
  }
  if (metadata) {
    updates.push(`metadata = $${idx++}::jsonb`);
    params.push(JSON.stringify(metadata));
  }
  if (updates.length === 0) {
    throw new ValidationError('No updates supplied');
  }
  params.push(projectId);
  params.push(organizationId);
  const { rows } = await query(
    `UPDATE projects
        SET ${updates.join(', ')}, updated_at = now()
      WHERE id = $${idx++} AND organization_id = $${idx}
      RETURNING *`,
    params
  );
  if (!rows[0]) throw new NotFoundError('Project not found');
  return rows[0];
}

export async function recordPoleSet({ projectId, organizationId, version, data, checksum, createdBy }) {
  if (typeof version !== 'number') {
    throw new ValidationError('Pole set version must be numeric');
  }
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Pole set data must be provided');
  }
  const payload = JSON.stringify(data);
  const { rows } = await query(
    `INSERT INTO pole_sets (project_id, version, data, checksum, created_by)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING *`,
    [projectId, version, payload, checksum || null, createdBy || null]
  );
  const created = rows[0];
  if (!created) throw new NotFoundError('Unable to record pole set');
  return created;
}

export async function listPoleSets({ projectId }) {
  const { rows } = await query(
    `SELECT id, version, data, checksum, created_at, created_by
       FROM pole_sets
      WHERE project_id = $1
      ORDER BY version DESC`,
    [projectId]
  );
  return rows;
}

export async function recordAuditEvent({ organizationId, actorId, action, targetType, targetId, context = {} }) {
  await query(
    `INSERT INTO audit_events (organization_id, actor_id, action, target_type, target_id, context)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`
    , [organizationId, actorId || null, action, targetType, targetId || null, JSON.stringify(context)]
  );
}

export async function listAuditEvents({ organizationId, limit = 50 }) {
  const { rows } = await query(
    `SELECT * FROM audit_events
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [organizationId, limit]
  );
  return rows;
}
