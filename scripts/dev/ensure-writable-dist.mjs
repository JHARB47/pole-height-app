#!/usr/bin/env node

import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

/** @param {string} p */
async function isWritable(p) {
  try {
    await fs.access(p, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const repoRoot = process.cwd();
  const distDir = path.join(repoRoot, "dist");

  // No dist yet: nothing to validate.
  try {
    await fs.stat(distDir);
  } catch {
    return;
  }

  // If dist exists but isn't writable, Vite will fail with a confusing EACCES on cleanup.
  const distWritable = await isWritable(distDir);
  if (!distWritable) {
    console.error("Build blocked: dist/ is not writable.");
    console.error(
      "This usually happens if a previous build was run with sudo, causing root-owned files.",
    );
    console.error("Fix (macOS/Linux):");
    console.error('  sudo chown -R "$(id -un)":"$(id -gn)" dist');
    console.error("Or, if you do not need the artifacts:");
    console.error("  sudo rm -rf dist");
    process.exit(1);
  }

  // Also validate a known problematic path if present.
  const viteManifest = path.join(distDir, ".vite", "manifest.json");
  try {
    await fs.stat(viteManifest);
    const manifestWritable = await isWritable(viteManifest);
    if (!manifestWritable) {
      console.error(
        "Build blocked: dist/.vite/manifest.json exists but is not writable.",
      );
      console.error("Fix (macOS/Linux):");
      console.error('  sudo chown -R "$(id -un)":"$(id -gn)" dist');
      process.exit(1);
    }
  } catch {
    // ignore
  }
}

try {
  await main();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}
