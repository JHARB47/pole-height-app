/* eslint-env node */
import crypto from "crypto";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

function verifyNetlifySecret(event) {
  const secret = process.env.NETLIFY_DEPLOY_WEBHOOK_SECRET;
  if (!secret) return true; // if not set, accept (optional hardening)
  const sig = event.headers["x-webhook-signature"];
  if (!sig) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const dig = hmac.update(event.body || "").digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(dig, "hex"),
    );
  } catch {
    return false;
  }
}

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
  if (!verifyNetlifySecret(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid signature" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid JSON" }),
    };
  }

  // Expecting Netlify deploy webhook payload
  const branch = payload.branch;
  const commitRef =
    payload.commit_ref ||
    payload.commit_ref_sha ||
    payload.commit_ref_id ||
    payload.commit_ref; // best-effort
  const siteUrl =
    payload.url || payload.deploy_ssl_url || payload.admin_url || null;
  const repo = payload.build_info && payload.build_info.repo_path; // e.g., owner/repo
  if (!branch || !commitRef || !repo) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, ignored: true }),
    };
  }

  const [owner, name] = repo.split("/");
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID; // Optional override if webhook not available

  /**
   * @param {string | undefined} pem
   * @returns {string | undefined}
   */
  function normalizePrivateKey(pem) {
    if (!pem) return pem;
    if (pem.includes("BEGIN") && pem.includes("\n"))
      return pem.replace(/\\n/g, "\n");
    return pem;
  }

  const privateKey = normalizePrivateKey(rawKey);
  if (!appId || !privateKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, skipped: "missing app credentials" }),
    };
  }

  try {
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId, privateKey, installationId },
      userAgent: "poleplanpro-netlify-functions",
    });

    // Find our check run and complete it
    const listResp = await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
      {
        owner,
        repo: name,
        ref: commitRef,
      },
    );
    const existing = Array.isArray(listResp.data.check_runs)
      ? listResp.data.check_runs.find((cr) => cr.name === "Preview: Links")
      : null;

    const customBase = process.env.PREVIEW_DOMAIN_BASE;
    const branchSlug = (branch || "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const customUrl = customBase
      ? `https://${branchSlug}.${customBase}/`
      : null;
    const urls = [
      siteUrl ? `Default: ${siteUrl}` : null,
      customUrl ? `Custom: ${customUrl}` : null,
    ].filter(Boolean);
    const outputSummary = urls.length ? urls.join("\n") : "Preview deployed.";
    const outputText = urls.length
      ? `Links:\n- ${urls.join("\n- ")}`
      : "Preview URL not available.";

    if (existing) {
      await octokit.request(
        "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
        {
          owner,
          repo: name,
          check_run_id: existing.id,
          status: "completed",
          conclusion: "success",
          details_url: customUrl || siteUrl || undefined,
          output: {
            title: "Preview links",
            summary: outputSummary,
            text: outputText,
          },
        },
      );
    } else {
      await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
        owner,
        repo: name,
        name: "Preview: Links",
        head_sha: commitRef,
        status: "completed",
        conclusion: "success",
        details_url: customUrl || siteUrl || undefined,
        output: {
          title: "Preview links",
          summary: outputSummary,
          text: outputText,
        },
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, completed: true, url: siteUrl }),
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
