import { query } from '../db/client.js';

export async function getOrganizationById(id) {
  const { rows } = await query('SELECT * FROM organizations WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getOrganizationByExternalId(externalId) {
  if (!externalId) return null;
  const { rows } = await query('SELECT * FROM organizations WHERE external_id = $1', [externalId]);
  return rows[0] || null;
}

export async function createOrganization({ name, externalId }) {
  const { rows } = await query(
    `INSERT INTO organizations (name, external_id)
     VALUES ($1, $2)
     RETURNING *`,
    [name, externalId || null]
  );
  return rows[0];
}

export async function listOrganizationsForUser(userId) {
  const { rows } = await query(
    `SELECT DISTINCT o.*
       FROM organizations o
       JOIN users u ON u.organization_id = o.id
      WHERE u.id = $1`,
    [userId]
  );
  return rows;
}

export async function getDepartmentById(id) {
  if (!id) return null;
  const { rows } = await query('SELECT * FROM departments WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getOrCreateDepartment({ organizationId, name }) {
  if (!organizationId || !name) return null;
  const existing = await query(
    `SELECT * FROM departments WHERE organization_id = $1 AND name = $2`,
    [organizationId, name]
  );
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await query(
    `INSERT INTO departments (organization_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [organizationId, name]
  );
  return rows[0];
}
