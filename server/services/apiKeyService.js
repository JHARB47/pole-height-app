import crypto from "node:crypto";
import { query } from "../db/client.js";
import { hashSecret, verifySecret } from "./userService.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export function generateApiKey() {
  const token = crypto.randomBytes(24).toString("base64url");
  const id = crypto.randomUUID();
  return { id, secret: token, composite: `${id}.${token}` };
}

export async function createApiKey({
  organizationId,
  name,
  scopes = [],
  createdBy,
}) {
  const key = generateApiKey();
  const hash = await hashSecret(key.secret);
  const { rows } = await query(
    `INSERT INTO api_keys (id, organization_id, name, hashed_key, scopes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [key.id, organizationId, name, hash, scopes, createdBy || null],
  );
  return { meta: rows[0], secret: key.composite };
}

export async function listApiKeys(organizationId) {
  const { rows } = await query(
    `SELECT id, organization_id, name, scopes, created_at, last_used_at, created_by
       FROM api_keys
      WHERE organization_id = $1
      ORDER BY created_at DESC`,
    [organizationId],
  );
  return rows;
}

export async function revokeApiKey(organizationId, id) {
  const { rowCount } = await query(
    `DELETE FROM api_keys WHERE organization_id = $1 AND id = $2`,
    [organizationId, id],
  );
  if (rowCount === 0) {
    throw new NotFoundError("API key not found");
  }
}

export async function findApiKeyByComposite(composite) {
  if (!composite) return null;
  const [id, secret] = composite.split(".");
  if (!id || !secret) return null;
  const { rows } = await query("SELECT * FROM api_keys WHERE id = $1", [id]);
  const key = rows[0];
  if (!key) return null;
  const valid = await verifySecret(secret, key.hashed_key);
  if (!valid) return null;
  await query("UPDATE api_keys SET last_used_at = now() WHERE id = $1", [id]);
  return key;
}

export function assertScope(key, scope) {
  if (!key.scopes || key.scopes.length === 0) return;
  if (!key.scopes.includes(scope)) {
    throw new ForbiddenError("API key scope denied");
  }
}
