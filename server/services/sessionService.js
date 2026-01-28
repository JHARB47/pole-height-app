import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { query } from "../db/client.js";
import { ENV } from "../config/env.js";
import { hashSecret, verifySecret } from "./userService.js";
import { UnauthorizedError } from "../utils/errors.js";

function tokenExpiryToDate(ttl) {
  const now = new Date();
  if (typeof ttl === "number") {
    return new Date(now.getTime() + ttl * 1000);
  }
  // Expect string like 7d, 12h
  const match = /^([0-9]+)([smhdw])$/.exec(ttl || "7d");
  if (!match) return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  const seconds = value * (multipliers[unit] || 86400);
  return new Date(now.getTime() + seconds * 1000);
}

export async function issueTokens(user) {
  const sessionId = crypto.randomUUID();
  const refreshSecret = crypto.randomBytes(32).toString("base64url");
  const compositeRefresh = `${sessionId}.${refreshSecret}`;
  const refreshHash = await hashSecret(refreshSecret);
  const expiresAt = tokenExpiryToDate(ENV.refreshTokenTtl);
  await query(
    `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, user.id, refreshHash, expiresAt],
  );
  const claims = {
    sub: user.id,
    org: user.organization_id,
    dept: user.department_id,
    role: user.role,
  };
  const token = jwt.sign(claims, ENV.jwtSecret, {
    expiresIn: ENV.jwtExpiresIn,
    issuer: ENV.serviceName,
  });
  return {
    accessToken: token,
    refreshToken: compositeRefresh,
    expiresIn: ENV.jwtExpiresIn,
  };
}

export async function refreshTokens(refreshToken) {
  const [sessionId, secret] = (refreshToken || "").split(".");
  if (!sessionId || !secret) {
    throw new UnauthorizedError("Invalid refresh token");
  }
  const { rows } = await query("SELECT * FROM sessions WHERE id = $1", [
    sessionId,
  ]);
  const session = rows[0];
  if (!session) throw new UnauthorizedError("Session expired");
  if (new Date(session.expires_at) < new Date()) {
    await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    throw new UnauthorizedError("Session expired");
  }
  const valid = await verifySecret(secret, session.refresh_token_hash);
  if (!valid) {
    await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    throw new UnauthorizedError("Invalid refresh token");
  }
  await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  return session.user_id;
}

export async function revokeSessionsForUser(userId) {
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}
