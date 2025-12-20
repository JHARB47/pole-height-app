import process from "node:process";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

/**
 * Case-insensitive header getter (Netlify typically lowercases, but don't rely on it).
 * @param {any} event
 * @param {string} name
 */
function getHeader(event, name) {
  const headers = event?.headers ?? {};
  const direct = headers[name];
  if (typeof direct === "string") return direct;
  const lower = name.toLowerCase();
  const byLower = headers[lower];
  if (typeof byLower === "string") return byLower;
  for (const [k, v] of Object.entries(headers)) {
    if (k && k.toLowerCase() === lower && typeof v === "string") return v;
  }
  return undefined;
}

/**
 * @param {any} event
 * @returns {Buffer}
 */
function getRawBody(event) {
  if (event?.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64");
  }
  return Buffer.from(event?.body || "", "utf8");
}

/**
 * @param {any} event
 * @param {string | undefined} [secretOverride]
 */
function verifyNetlifySecret(event, secretOverride) {
  const secret = secretOverride ?? process.env.NETLIFY_DEPLOY_WEBHOOK_SECRET;
  if (!secret) return true; // if not set, accept (optional hardening)
  let sig = getHeader(event, "x-webhook-signature");
  if (!sig) return false;

  // Defensive: allow a possible "sha256=<hex>" form.
  const eq = sig.indexOf("=");
  if (eq >= 0) sig = sig.slice(eq + 1).trim();

  // hex-only signature (and limit size to avoid allocating huge buffers)
  if (sig.length > 2048 || sig.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(sig)) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const dig = hmac.update(getRawBody(event)).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(dig, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { getHeader, verifyNetlifySecret };

/**
 * @param {any} event
 */
export async function handler(event) {
  const headers = {
    "content-type": "application/json",
    "cache-control": "no-store",
  };

  /**
   * @param {number} statusCode
   * @param {any} body
   */
  const respond = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  if (event.httpMethod !== "POST") {
    return respond(405, { ok: false, error: "Method not allowed" });
  }
  if (!verifyNetlifySecret(event)) {
    return respond(401, { ok: false, error: "Invalid signature" });
  }

  const payload = safeParse(event.body || "{}");
  if (!payload.ok) {
    return respond(400, { ok: false, error: "Invalid JSON" });
  }

  const meta = extractPayloadMeta(payload.data);
  if (!meta) {
    return respond(200, { ok: true, ignored: true });
  }

  const { branch, commitRef, siteUrl, owner, name } = meta;

  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID; // Optional override if webhook not available

  /**
   * @param {string | undefined} pem
   * @returns {string | undefined}
   */
  function normalizePrivateKey(pem) {
    if (!pem) return pem;
    // Support env-style single-line keys that contain literal "\n".
    const literalNewline = String.raw`\n`;
    if (pem.includes(literalNewline)) return pem.replaceAll(literalNewline, "\n");
    return pem;
  }

  const privateKey = normalizePrivateKey(rawKey);
  if (!appId || !privateKey) {
    return respond(200, { ok: true, skipped: "missing app credentials" });
  }

  try {
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId, privateKey, installationId },
      userAgent: "poleplanpro-netlify-functions",
    });

    await completePreviewCheckRun({
      octokit,
      owner,
      repo: name,
      branch,
      commitRef,
      siteUrl,
    });

    return respond(200, { ok: true, completed: true, url: siteUrl });
  } catch (e) {
    return respond(200, {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * @param {{
 *   octokit: any;
 *   owner: string;
 *   repo: string;
 *   branch: string;
 *   commitRef: string;
 *   siteUrl: string | null;
 * }} args
 */
async function completePreviewCheckRun({
  octokit,
  owner,
  repo,
  branch,
  commitRef,
  siteUrl,
}) {
  const listResp = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
    {
      owner,
      repo,
      ref: commitRef,
    },
  );
  const existing = Array.isArray(listResp.data.check_runs)
    ? listResp.data.check_runs.find(
        /** @param {any} cr */ (cr) => cr.name === "Preview: Links",
      )
    : null;

  const customBase = process.env.PREVIEW_DOMAIN_BASE;
  const branchSlug = (branch || "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-")
    .replaceAll(/(^-+|-+$)/g, "")
    .replaceAll(/-+/g, "-");
  const customUrl = customBase ? `https://${branchSlug}.${customBase}/` : null;
  const urls = [
    siteUrl ? `Default: ${siteUrl}` : null,
    customUrl ? `Custom: ${customUrl}` : null,
  ].filter(Boolean);
  const outputSummary = urls.length ? urls.join("\n") : "Preview deployed.";
  const outputText = urls.length
    ? `Links:\n- ${urls.join("\n- ")}`
    : "Preview URL not available.";

  const detailsUrl = customUrl || siteUrl || undefined;
  if (existing) {
    await octokit.request(
      "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
      {
        owner,
        repo,
        check_run_id: existing.id,
        status: "completed",
        conclusion: "success",
        details_url: detailsUrl,
        output: {
          title: "Preview links",
          summary: outputSummary,
          text: outputText,
        },
      },
    );
    return;
  }

  await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
    owner,
    repo,
    name: "Preview: Links",
    head_sha: commitRef,
    status: "completed",
    conclusion: "success",
    details_url: detailsUrl,
    output: {
      title: "Preview links",
      summary: outputSummary,
      text: outputText,
    },
  });
}

/**
 * @param {string} body
 */
function safeParse(body) {
  try {
    return { ok: true, data: JSON.parse(body) };
  } catch {
    return { ok: false };
  }
}

/**
 * @param {any} payload
 */
function extractPayloadMeta(payload) {
  const branch = payload.branch;
  const commitRef =
    payload.commit_ref ||
    payload.commit_ref_sha ||
    payload.commit_ref_id ||
    payload.commit_ref;
  const siteUrl =
    payload.url || payload.deploy_ssl_url || payload.admin_url || null;
  const repoPath = payload.build_info && payload.build_info.repo_path;
  if (!branch || !commitRef || !repoPath) return null;
  const [owner, name] = repoPath.split("/");
  if (!owner || !name) return null;
  return { branch, commitRef, siteUrl, owner, name };
}
