#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
    console.error(
      "[repo-hygiene] git command failed:",
      error?.message || error,
    );
    process.exit(1);
  }
}

const trackedFiles = new Set(runGit("ls-files --cached"));

function listRelativeFilesUnderDir(relativeDir) {
  const dirFullPath = join(repoRoot, relativeDir);
  if (!existsSync(dirFullPath)) return [];

  const out = [];
  const stack = [relativeDir];

  while (stack.length > 0) {
    const currentRelative = stack.pop();
    const currentFull = join(repoRoot, currentRelative);
    let entries;
    try {
      entries = readdirSync(currentFull, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const childRelative = join(currentRelative, entry.name);
      const childFull = join(repoRoot, childRelative);

      if (entry.isDirectory()) {
        stack.push(childRelative);
        continue;
      }

      if (entry.isFile()) {
        out.push(childRelative);
        continue;
      }

      // Fallback for unusual Dirent types.
      try {
        if (statSync(childFull).isFile()) out.push(childRelative);
      } catch {
        // ignore
      }
    }
  }

  return out;
}

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
    label: "backup files (*.bak)",
    test: (path) => path.endsWith(".bak"),
    hint: "Remove backup files and add patterns to .gitignore (e.g., *.bak).",
  },
  {
    label: "committed .env files",
    test: (path) => {
      // Allow safe examples and test-only knobs.
      if (path === ".env.example" || path.endsWith("/.env.example"))
        return false;
      if (path === ".env.test") return false;

      // Block .env and .env.* anywhere.
      return (
        path === ".env" ||
        path.endsWith("/.env") ||
        path.startsWith(".env.") ||
        /\/.env\./.test(path)
      );
    },
    hint: "Do not commit real environment files. Keep only .env.example (and optionally .env.test).",
  },
  {
    label: "nested project copies (pole-height-app/)",
    test: (path) =>
      path === "pole-height-app" || path.startsWith("pole-height-app/"),
    hint: "The repository should not contain nested checkouts; delete the extra folder before committing.",
  },
];

const contentSecretDescriptors = [
  {
    label: "Neon / Postgres credential token (npg_…)",
    regex: /postgresql:\/\/[^\s<]*npg_[A-Za-z0-9]{8,}[^\s]*@/g,
    hint: "Replace with placeholders (e.g., postgresql://<user>:<password>@<host>/<db>…) and store real values in env vars.",
  },
  {
    label: "JWT secret hex (likely real)",
    regex: /\b(JWT_SECRET|REFRESH_TOKEN_SECRET)=[0-9a-f]{40,}\b/gi,
    hint: "Never commit token secrets. Move to env vars and rotate any leaked values.",
  },
  {
    label: "GitHub client secret (looks real)",
    regex: /\bGITHUB_CLIENT_SECRET=[0-9a-f]{20,}\b/gi,
    hint: "Never commit OAuth secrets. Move to env vars and rotate any leaked values.",
  },
];

function findSecretHitsInFile(relativePath, regex) {
  // Exclude known example docs that intentionally contain commented sample output.
  if (relativePath === "jwt-secret-generation.md") return [];
  if (
    relativePath.endsWith(".svg") ||
    relativePath.endsWith(".png") ||
    relativePath.endsWith(".jpg")
  )
    return [];

  const fullPath = join(repoRoot, relativePath);
  let contents;
  try {
    contents = readFileSync(fullPath, "utf8");
  } catch {
    return [];
  }

  const hits = [];
  const lines = contents.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // Ignore pure-comment examples.
    if (line.trimStart().startsWith("#")) continue;
    if (regex.test(line)) {
      hits.push(i + 1);
    }
    regex.lastIndex = 0;
  }
  return hits;
}

const hygieneViolations = [];

for (const descriptor of forbiddenDescriptors) {
  const hits = Array.from(trackedFiles).filter(descriptor.test);
  if (hits.length > 0) {
    hygieneViolations.push({ descriptor, hits });
  }
}

// Netlify Dev treats everything under netlify/functions as deployable functions.
// Test/spec files in that folder will be loaded as functions and can break local validation.
const netlifyFunctionFiles = listRelativeFilesUnderDir("netlify/functions");
const badFunctionTestFiles = netlifyFunctionFiles
  .filter((p) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(p))
  .sort();

if (badFunctionTestFiles.length > 0) {
  hygieneViolations.push({
    descriptor: {
      label: "test/spec files inside Netlify Functions (netlify/functions/)",
      hint: "Move tests to netlify/tests/ (or outside netlify/functions/) so Netlify Dev doesn't load them as functions.",
    },
    hits: badFunctionTestFiles,
  });
}

for (const secretDescriptor of contentSecretDescriptors) {
  const filesWithHits = [];
  for (const filePath of trackedFiles) {
    const hitLines = findSecretHitsInFile(filePath, secretDescriptor.regex);
    if (hitLines.length > 0) {
      filesWithHits.push(
        `${filePath} (lines: ${hitLines.slice(0, 10).join(",")}${hitLines.length > 10 ? ",…" : ""})`,
      );
    }
  }

  if (filesWithHits.length > 0) {
    hygieneViolations.push({
      descriptor: {
        label: `possible committed secrets: ${secretDescriptor.label}`,
        hint: secretDescriptor.hint,
      },
      hits: filesWithHits,
    });
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
    "This branch contains files that reduce performance or break repo structure. Clean them up before continuing.",
  );
  process.exit(1);
}

console.log(
  "✅ Repository hygiene check passed: no tracked build artifacts and required docs are present.",
);
