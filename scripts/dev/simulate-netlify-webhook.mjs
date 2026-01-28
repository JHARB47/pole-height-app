#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
if (typeof fetch === "undefined") {
  const mod = await import("node-fetch");
  globalThis.fetch = mod.default || mod;
}

const argv = process.argv.slice(2);
const file =
  argv.find((a) => !a.startsWith("--")) ||
  "scripts/dev/fixtures/netlify.deploy.json";
const shouldPost = argv.includes("--post");
const urlArg = argv.find((a) => a.startsWith("--url="));
const baseUrl = urlArg
  ? urlArg.split("=")[1]
  : process.env.NETLIFY_DEV_URL || "http://localhost:8888";
const endpoint = `${baseUrl.replace(/\/$/, "")}/.netlify/functions/netlify_deploy_webhook`;
const payload = fs.readFileSync(file, "utf8");
const secret = process.env.NETLIFY_DEPLOY_WEBHOOK_SECRET || "";

function sign(body) {
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const headers = {
  "content-type": "application/json",
};
const sig = sign(payload);
if (sig) headers["x-webhook-signature"] = sig;

console.log("# Simulated Netlify headers");
console.log(JSON.stringify(headers, null, 2));
console.log("\n# Body");
console.log(payload);

console.log("\n# curl (optional)");
console.log(`curl -s -X POST \
  -H 'content-type: application/json' ${sig ? `\\\n  -H 'x-webhook-signature: ${sig}'` : ""} \
  --data-binary @${file} \
  ${endpoint}`);

if (shouldPost) {
  const postHeaders = { "content-type": "application/json" };
  if (sig) postHeaders["x-webhook-signature"] = sig;
  console.log(`\n# POSTing to ${endpoint} ...`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: postHeaders,
    body: payload,
  });
  const text = await res.text();
  console.log(`# Response: ${res.status}`);
  console.log(text);
}
