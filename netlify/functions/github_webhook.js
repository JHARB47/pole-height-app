import process from "node:process";
import { Buffer } from "node:buffer";
import crypto from "crypto";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

/**
 * Case-insensitive header getter (Netlify typically lowercases, but don't rely on it).
 * @param {any} event
 * @param {string} name
 * @returns {string | undefined}
 */
function getHeader(event, name) {
  const headers = event?.headers ?? {};
  const direct = headers[name];
  if (typeof direct === "string") return direct;
  const lower = name.toLowerCase();
  const byLower = headers[lower];
  if (typeof byLower === "string") return byLower;
  // Fallback: scan keys once (defensive)
  for (const [k, v] of Object.entries(headers)) {
    if (k && k.toLowerCase() === lower && typeof v === "string") return v;
  }
  return undefined;
}

/**
 * @param {string} secret
 * @param {Buffer} payload
 * @param {string} signature
 * @returns {boolean}
 */
function verifySignature(secret, payload, signature) {
  if (!secret || !signature) return false;
  const eq = signature.indexOf("=");
  if (eq < 0) return false;
  const algo = signature.slice(0, eq).trim().toLowerCase();
  const sig = signature.slice(eq + 1).trim();
  if (!algo || !sig) return false;
  // Only accept the algorithms GitHub uses for webhook signatures.
  if (algo !== "sha256" && algo !== "sha1") return false;
  // hex-only signature (and limit size to avoid allocating huge buffers)
  if (sig.length > 2048 || sig.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(sig)) {
    return false;
  }
  const hmac = crypto.createHmac(algo, secret);
  const digest = hmac.update(payload).digest("hex");
  // Constant-time compare
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(digest, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * @param {any} event
 * @returns {Buffer}
 */
function getRawBody(event) {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64");
  }
  // Return as Buffer to ensure stable HMAC calculation
  return Buffer.from(event.body || "", "utf8");
}

/**
 * @param {string} ref
 * @returns {string}
 */
function sanitizeBranchName(ref) {
  // Git refs look like "refs/heads/feature/x"; keep full branch name
  const raw = String(ref || "").replace(/^refs\/heads\//, "");
  // Netlify branch slugs are lowercase with non [a-z0-9-] replaced by '-'
  // (also collapses path separators into '-')
  return raw
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-")
    .replaceAll(/(^-+|-+$)/g, "")
    .replaceAll(/-+/g, "-");
}

/**
 * Supports both true multiline PEM and env-style "\\n" escaped PEM.
 * @param {string | undefined} pem
 * @returns {string | undefined}
 */
export function normalizePrivateKey(pem) {
  if (!pem) return pem;
  // If the key is stored as a single-line env var, it typically contains literal "\\n".
  const literalNewline = String.raw`\n`;
  if (pem.includes(literalNewline)) return pem.replaceAll(literalNewline, "\n");
  return pem;
}

/**
 * @param {string} ref
 * @returns {string | null}
 */
function computePreviewUrlForBranch(ref) {
  const siteBase = process.env.NETLIFY_SITE_BASE || "poleplanpro.netlify.app";
  const sub = siteBase.split(".")[0];
  const branch = sanitizeBranchName(ref);
  if (!branch || !sub) return null;
  return `https://${branch}--${sub}.netlify.app/`;
}

/**
 * @param {string} ref
 * @returns {string | null}
 */
function computeCustomDomainUrlForBranch(ref) {
  const base = process.env.PREVIEW_DOMAIN_BASE; // e.g., 'poleplanpro.com' for branch.domain style
  const branch = sanitizeBranchName(ref);
  if (!base || !branch) return null;
  return `https://${branch}.${base}/`;
}

/**
 * @param {object} params
 * @param {string | number} params.prNumber
 * @param {string} params.headRef
 * @param {string} params.baseRef
 * @param {string | null} params.defaultUrl
 * @param {string | null} params.customUrl
 * @returns {{ summary: string, text: string, detailsUrl?: string }}
 */
function buildPreviewOutput({
  prNumber,
  headRef,
  baseRef,
  defaultUrl,
  customUrl,
}) {
  const lines = [];
  if (defaultUrl) lines.push(`Default: ${defaultUrl}`);
  if (customUrl) lines.push(`Custom: ${customUrl}`);
  const summary = lines.length
    ? lines.join("\n")
    : "Preview URL not available yet.";
  const ts = new Date().toISOString();
  const text =
    `PR #${prNumber} (${headRef} → ${baseRef})\n\n` +
    (lines.length
      ? `Links:\n- ${lines.join("\n- ")}`
      : "No preview link could be guessed.") +
    `\n\nLast refreshed: ${ts}`;
  const detailsUrl = customUrl || defaultUrl || undefined;
  return { summary, text, detailsUrl };
}

/**
 * @param {any} event
 * @returns {Promise<{statusCode: number, headers: Record<string, string>, body: string}>}
 */
export async function handler(event) {
  const headers = {
    "content-type": "application/json",
    "cache-control": "no-store",
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  const signature =
    getHeader(event, "x-hub-signature-256") ||
    getHeader(event, "x-hub-signature");
  const delivery = getHeader(event, "x-github-delivery");
  const eventName = getHeader(event, "x-github-event");
  const rawBuffer = getRawBody(event);
  const payloadRaw = rawBuffer.toString("utf8");

  if (!secret || !verifySignature(secret, rawBuffer, signature || "")) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid signature" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid JSON payload" }),
    };
  }

  // Handle ping (handshake)
  if (eventName === "ping") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, pong: true, delivery }),
    };
  }

  // Handle Pull Request events
  if (eventName === "pull_request") {
    const action = payload.action; // opened, edited, synchronize, reopened
    const pr = payload.pull_request || {};
    const repo = payload.repository || {};
    const repoFull = repo.full_name;
    const prNumber = pr.number;
    const headRef = pr.head && pr.head.ref;
    const baseRef = pr.base && pr.base.ref;
    const prUrl = pr.html_url;

    // Example: enrich previews, enforce rules, or trigger CI
    const log = {
      event: eventName,
      action,
      repo: repoFull,
      prNumber,
      headRef,
      baseRef,
      prUrl,
      delivery,
    };

    // Prepare preview URL guesses based on branch name
    const defaultPreviewUrl = computePreviewUrlForBranch(
      pr.head && pr.head.ref,
    );
    const customPreviewUrl = computeCustomDomainUrlForBranch(
      pr.head && pr.head.ref,
    );

    // Prepare comment content
    const template = process.env.GITHUB_WEBHOOK_COMMENT_TEMPLATE;
    const previewLine =
      customPreviewUrl || defaultPreviewUrl
        ? `\n\n🔗 Preview (guessed): ${customPreviewUrl || defaultPreviewUrl}`
        : "";

    const commentBody = template
      ? template
          .replaceAll("{action}", action)
          .replaceAll("{prNumber}", String(prNumber))
          .replaceAll("{headRef}", String(headRef || ""))
          .replaceAll("{baseRef}", String(baseRef || ""))
          .replaceAll(
            "{previewUrl}",
            String(customPreviewUrl || defaultPreviewUrl || ""),
          )
      : `🔔 Webhook: ${action} for PR #${prNumber} (${headRef} → ${baseRef}).${previewLine}`;

    // Try GitHub App authentication via Octokit first (no PAT required)
    let commentResult = null;
    const appId = process.env.GITHUB_APP_ID;
    const rawKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = payload.installation && payload.installation.id;

    /**
     * @param {string | undefined} pem
     * @returns {string | undefined}
     */
    const privateKey = normalizePrivateKey(rawKey);
    const owner = repo.owner && repo.owner.login;
    const name = repo.name;

    let checkResult = null;
    if (appId && privateKey && installationId && owner && name) {
      try {
        const octokit = new Octokit({
          authStrategy: createAppAuth,
          auth: {
            appId,
            privateKey,
            installationId,
          },
          userAgent: "poleplanpro-netlify-functions",
        });

        // Create or update a Check Run with preview details
        const headSha = pr.head && pr.head.sha;
        if (headSha) {
          try {
            const output = buildPreviewOutput({
              prNumber,
              headRef,
              baseRef,
              defaultUrl: defaultPreviewUrl,
              customUrl: customPreviewUrl,
            });

            // Try to find an existing check run with the same name on this SHA
            const listResp = await octokit.request(
              "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
              {
                owner,
                repo: name,
                ref: headSha,
              },
            );
            const existing = Array.isArray(listResp.data.check_runs)
              ? listResp.data.check_runs.find(
                  (cr) => cr.name === "Preview: Links",
                )
              : null;

            if (existing) {
              const upd = await octokit.request(
                "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
                {
                  owner,
                  repo: name,
                  check_run_id: existing.id,
                  status: "in_progress",
                  details_url: output.detailsUrl,
                  output: {
                    title: "Preview links",
                    summary: output.summary,
                    text: output.text,
                  },
                  actions: [
                    {
                      label: "Retry",
                      description: "Recheck preview status",
                      identifier: "retry",
                    },
                  ],
                },
              );
              checkResult = { ok: true, id: upd.data.id, updated: true };
            } else {
              const checkResp = await octokit.request(
                "POST /repos/{owner}/{repo}/check-runs",
                {
                  owner,
                  repo: name,
                  name: "Preview: Links",
                  head_sha: headSha,
                  status: "in_progress",
                  details_url: output.detailsUrl,
                  output: {
                    title: "Preview links",
                    summary: output.summary,
                    text: output.text,
                  },
                  actions: [
                    {
                      label: "Retry",
                      description: "Recheck preview status",
                      identifier: "retry",
                    },
                  ],
                },
              );
              checkResult = { ok: true, id: checkResp.data.id, created: true };
            }
          } catch (e) {
            checkResult = {
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        }

        // Idempotent PR comment: find existing managed comment to update
        const marker = "<!-- preview-links:managed -->";
        const list = await octokit.request(
          "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
          {
            owner,
            repo: name,
            issue_number: prNumber,
            per_page: 100,
          },
        );
        const mine = Array.isArray(list.data)
          ? list.data.find(
              (c) => typeof c.body === "string" && c.body.includes(marker),
            )
          : null;
        const bodyWithMarker = `${commentBody}\n\n${marker}`;
        if (mine) {
          await octokit.request(
            "PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
            {
              owner,
              repo: name,
              comment_id: mine.id,
              body: bodyWithMarker,
            },
          );
          commentResult = { ok: true, via: "app", updated: true };
        } else {
          await octokit.request(
            "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
            {
              owner,
              repo: name,
              issue_number: prNumber,
              body: bodyWithMarker,
            },
          );
          commentResult = { ok: true, via: "app", created: true };
        }
      } catch (e) {
        commentResult = {
          ok: false,
          via: "app",
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }

    // Fallback to PAT/token if App auth wasn't configured or failed
    if (
      (!commentResult || !commentResult.ok) &&
      repo.owner &&
      repo.name &&
      prNumber
    ) {
      const tokenFallback =
        process.env.GITHUB_APP_TOKEN || process.env.GITHUB_TOKEN;
      if (tokenFallback) {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${name}/issues/${prNumber}/comments`,
            {
              method: "POST",
              headers: {
                authorization: `Bearer ${tokenFallback}`,
                accept: "application/vnd.github+json",
                "user-agent": "poleplanpro-netlify-functions",
              },
              body: JSON.stringify({ body: commentBody }),
            },
          );
          if (!res.ok) {
            const text = await res.text();
            commentResult = {
              ok: false,
              via: "token",
              status: res.status,
              body: text,
            };
          } else {
            commentResult = { ok: true, via: "token" };
          }
        } catch (e) {
          commentResult = {
            ok: false,
            via: "token",
            error: e instanceof Error ? e.message : String(e),
          };
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        handled: true,
        log,
        commentResult,
        checkResult,
      }),
    };
  }

  // Handle Check Run actions (Retry / Re-request)
  if (eventName === "check_run") {
    const action = payload.action; // created, rerequested, requested_action, completed
    const isRetry =
      action === "requested_action" &&
      payload.requested_action?.identifier === "retry";
    const isRerequested = action === "rerequested";
    if (isRetry || isRerequested) {
      const appId = process.env.GITHUB_APP_ID;
      const rawKey = process.env.GITHUB_APP_PRIVATE_KEY;
      const installationId = payload.installation && payload.installation.id;
      const repo = payload.repository || {};
      const owner = repo.owner && repo.owner.login;
      const name = repo.name;
      const checkRun = payload.check_run || {};
      const headSha = checkRun.head_sha;
      const headBranch =
        (checkRun.check_suite && checkRun.check_suite.head_branch) || null;
      const privateKey = normalizePrivateKey(rawKey);

      if (appId && privateKey && installationId && owner && name && headSha) {
        try {
          const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: { appId, privateKey, installationId },
            userAgent: "poleplanpro-netlify-functions",
          });

          const defaultPreviewUrl = computePreviewUrlForBranch(headBranch);
          const customPreviewUrl = computeCustomDomainUrlForBranch(headBranch);
          const output = buildPreviewOutput({
            prNumber: "#",
            headRef: headBranch || "?",
            baseRef: "?",
            defaultUrl: defaultPreviewUrl,
            customUrl: customPreviewUrl,
          });

          await octokit.request(
            "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
            {
              owner,
              repo: name,
              check_run_id: checkRun.id,
              status: "in_progress",
              details_url: output.detailsUrl,
              output: {
                title: "Preview links",
                summary: output.summary,
                text: output.text,
              },
              actions: [
                {
                  label: "Retry",
                  description: "Recheck preview status",
                  identifier: "retry",
                },
              ],
            },
          );
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ok: true,
              retried: true,
              via: isRetry ? "requested_action" : "rerequested",
            }),
          };
        } catch (e) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            }),
          };
        }
      }
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, handled: true }),
    };
  }

  // Unhandled event types are acknowledged
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      handled: false,
      event: eventName,
      delivery,
    }),
  };
}

// Exported for unit tests (non-breaking for Netlify runtime)
export { getHeader, verifySignature, sanitizeBranchName };
