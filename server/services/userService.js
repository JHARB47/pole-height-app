import bcrypt from 'bcryptjs';
import { query } from '../db/client.js';
import { ValidationError } from '../utils/errors.js';

export async function getUserById(id) {
  if (!id) return null;
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getUserByEmail(organizationId, email) {
  if (!organizationId || !email) return null;
  const { rows } = await query(
    `SELECT * FROM users WHERE organization_id = $1 AND email = $2`,
    [organizationId, email.toLowerCase()]
  );
  return rows[0] || null;
}

export async function getUserBySsoSubject(subject) {
  if (!subject) return null;
  const { rows } = await query('SELECT * FROM users WHERE sso_subject = $1', [subject]);
  return rows[0] || null;
}

export async function updateUserRole({ userId, role }) {
  const allowed = ['engineer', 'manager', 'admin'];
  if (!allowed.includes(role)) {
    throw new ValidationError('Invalid role supplied');
  }
  const { rows } = await query(
    `UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [userId, role]
  );
  return rows[0] || null;
}

export async function createUser({ organizationId, departmentId, email, displayName, role = 'engineer', ssoSubject }) {
  const { rows } = await query(
    `INSERT INTO users (organization_id, department_id, email, display_name, role, sso_subject)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [organizationId, departmentId || null, email.toLowerCase(), displayName, role, ssoSubject || null]
  );
  return rows[0];
}

export async function upsertUserFromSsoProfile({ organizationId, departmentId, email, displayName, ssoSubject, defaultRole = 'engineer' }) {
  const existingBySubject = await getUserBySsoSubject(ssoSubject);
  if (existingBySubject) {
    return existingBySubject;
  }
  const existingByEmail = await getUserByEmail(organizationId, email);
  if (existingByEmail) {
    if (!existingByEmail.sso_subject) {
      await query(`UPDATE users SET sso_subject = $2 WHERE id = $1`, [existingByEmail.id, ssoSubject]);
      existingByEmail.sso_subject = ssoSubject;
    }
    return existingByEmail;
  }
  return createUser({ organizationId, departmentId, email, displayName, role: defaultRole, ssoSubject });
}

export async function deleteUserSessions(client, userId) {
  await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

export async function hashSecret(secret) {
  const saltRounds = 10;
  return bcrypt.hash(secret, saltRounds);
}

export async function verifySecret(secret, hash) {
  return bcrypt.compare(secret, hash);
}
