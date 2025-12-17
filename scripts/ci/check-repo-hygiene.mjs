#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");

function runGit(args) {
  try {
    return execSync(`git ${args}`, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (error?.status === 1) {
      return [];
    }
    console.error("[repo-hygiene] git command failed:", error?.message || error);
    process.exit(1);
  }
}

const trackedFiles = new Set(runGit("ls-files --cached"));

const forbiddenDescriptors = [
  {
    label: "build artifacts (dist/)",
    test: (path) => path === "dist" || path.startsWith("dist/"),
    hint: "Run `npm run clean` locally and avoid committing build output.",
  },
  {
    label: "coverage reports (coverage/)",
    test: (path) => path === "coverage" || path.startsWith("coverage/"),
    hint: "Coverage output should stay local; remove it with `rm -rf coverage`.",
  },
  {
    label: "nested project copies (pole-height-app/)",
    test: (path) => path === "pole-height-app" || path.startsWith("pole-height-app/"),
    hint: "The repository should not contain nested checkouts; delete the extra folder before committing.",
  },
];

const hygieneViolations = [];

for (const descriptor of forbiddenDescriptors) {
  const hits = Array.from(trackedFiles).filter(descriptor.test);
  if (hits.length > 0) {
    hygieneViolations.push({ descriptor, hits });
  }
}

const requiredPaths = [
  "docs/API-DOCUMENTATION.md",
  "docs/guides/DEPLOYMENT.md",
  "docs/guides/GIT-WORKFLOW.md",
  "README.md",
];

const missingPaths = requiredPaths.filter((relativePath) => {
  const fullPath = join(repoRoot, relativePath);
  return !existsSync(fullPath);
});

if (missingPaths.length > 0) {
  hygieneViolations.push({
    descriptor: {
      label: "required documentation",
      hint: "Restore the missing documentation from the main branch before merging.",
    },
    hits: missingPaths,
  });
}

if (hygieneViolations.length > 0) {
  console.error("\n🚫 Repository hygiene check failed:\n");
  for (const { descriptor, hits } of hygieneViolations) {
    console.error(` • Problematic ${descriptor.label}:`);
    hits.forEach((hit) => console.error(`    - ${hit}`));
    if (descriptor.hint) {
      console.error(`    Fix hint: ${descriptor.hint}`);
    }
    console.error("");
  }
  console.error(
    "This branch contains files that reduce performance or break repo structure. Clean them up before continuing."
  );
  process.exit(1);
}

console.log("✅ Repository hygiene check passed: no tracked build artifacts and required docs are present.");
