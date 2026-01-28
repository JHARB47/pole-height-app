#!/usr/bin/env node

/**
 * Comprehensive Project Cleanup Script
 * - Fixes markdown linting issues
 * - Removes unused files
 * - Cleans up dependencies
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.log("🧹 Starting comprehensive project cleanup...\n");

const rootDir = process.cwd();

// List of files that may be duplicates or no longer needed
const potentialUnusedFiles = [
  "BUILD-STATUS.md",
  "COMPLETE-SETUP-SUMMARY.md",
  "DEPENDENCY-MODERNIZATION.md",
  "DEPLOYMENT-COMPLETE-GUIDE.md",
  "DEPLOYMENT.md",
  "ENTERPRISE-IMPLEMENTATION.md",
  "GIT-WORKFLOW.md",
  "NETLIFY-READY.md",
  "NETLIFY-SECRETS.md",
  "NETLIFY-VISUAL-EDITOR-DEPLOYMENT-GUIDE.md",
  "UI_IMPROVEMENTS.md",
  "VISUAL-EDITOR-GUIDE.md",
  "format-demo.js",
  "performance-test.js",
  "test.html",
  "public/test.html",
  "public/debug.html",
];

// Fix markdown files
function fixMarkdownFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let fixed = false;

  // Fix MD022: Add blank lines around headings
  const headingRegex = /^(#{1,6}\s+.+)$/gm;
  content = content.replace(headingRegex, (match, heading, offset) => {
    const lines = content.split("\n");
    const currentIndex = content.substring(0, offset).split("\n").length - 1;

    let result = heading;
    const prevLine = lines[currentIndex - 1];
    const nextLine = lines[currentIndex + 1];

    // Add blank line before if needed
    if (currentIndex > 0 && prevLine && prevLine.trim() !== "") {
      result = "\n" + result;
      fixed = true;
    }

    // Add blank line after if needed
    if (currentIndex < lines.length - 1 && nextLine && nextLine.trim() !== "") {
      result = result + "\n";
      fixed = true;
    }

    return result;
  });

  // Fix MD032: Add blank lines around lists
  const listRegex = /^(\s*[-*+]\s+.+)$/gm;
  content = content.replace(listRegex, (match, listItem, offset) => {
    const lines = content.split("\n");
    const currentIndex = content.substring(0, offset).split("\n").length - 1;

    let result = listItem;
    const prevLine = lines[currentIndex - 1];
    const nextLine = lines[currentIndex + 1];

    const isPrevList = prevLine?.match(/^\s*[-*+]\s+/);
    const isNextList = nextLine?.match(/^\s*[-*+]\s+/);

    // Add blank line before first list item
    if (!isPrevList && prevLine?.trim() !== "") {
      result = "\n" + result;
      fixed = true;
    }

    // Add blank line after last list item
    if (!isNextList && nextLine?.trim() !== "") {
      result = result + "\n";
      fixed = true;
    }

    return result;
  });

  // Fix MD031: Add blank lines around fenced code blocks
  const codeBlockRegex = /^```[\s\S]*?^```$/gm;
  content = content.replace(codeBlockRegex, (match, offset) => {
    const lines = content.split("\n");
    const startIndex = content.substring(0, offset).split("\n").length - 1;
    const endIndex = startIndex + match.split("\n").length - 1;

    let result = match;
    const prevLine = lines[startIndex - 1];
    const nextLine = lines[endIndex + 1];

    // Add blank line before
    if (startIndex > 0 && prevLine?.trim() !== "") {
      result = "\n" + result;
      fixed = true;
    }

    // Add blank line after
    if (endIndex < lines.length - 1 && nextLine?.trim() !== "") {
      result = result + "\n";
      fixed = true;
    }

    return result;
  });

  // Fix MD040: Add language to fenced code blocks
  content = content.replace(/^```\s*$/gm, "```text");

  // Fix MD034: Wrap bare URLs
  content = content.replace(
    /(?<!<|`|])(https?:\/\/[^\s<>`\]]+)(?![>`\]])/g,
    "<$1>",
  );

  // Fix MD009: Remove trailing spaces
  content = content.replace(/[ \t]+$/gm, "");

  // Fix MD047: Ensure single trailing newline
  content = content.replace(/\n*$/, "\n");

  // Fix MD026: Remove trailing punctuation from headings
  content = content.replace(/^(#{1,6}\s+.+)[.,:;!?]+$/gm, "$1");

  // Fix MD036: Replace emphasis as heading
  content = content.replace(/^\*\*([^*]+)\*\*$/gm, "### $1");

  // Fix multiple consecutive blank lines
  content = content.replace(/\n{3,}/g, "\n\n");

  if (fixed) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }

  return false;
}

// Process markdown files
console.log("📝 Fixing markdown files...");
const markdownFiles = [
  "docs/SUBMODULE-SETUP.md",
  "PRODUCTION-READINESS-ANALYSIS.md",
  "WORKFLOW-ENHANCEMENT-SUMMARY.md",
];

let mdFixed = 0;
for (const file of markdownFiles) {
  const filePath = path.join(rootDir, file);
  if (fixMarkdownFile(filePath)) {
    console.log(`✅ Fixed: ${file}`);
    mdFixed++;
  } else {
    console.log(`✓ Clean: ${file}`);
  }
}

// Analyze unused files
console.log("\n🗂️  Analyzing potentially unused files...");
let filesAnalyzed = 0;
let filesToRemove = [];

for (const file of potentialUnusedFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    // Check if file is referenced in other files
    try {
      const result = execSync(
        `grep -r "${file}" . --exclude-dir=node_modules --exclude="*.log" --exclude="${file}" || true`,
        { encoding: "utf8", stdio: "pipe" },
      );

      if (!result.trim()) {
        filesToRemove.push(file);
        console.log(`🗑️  Unused: ${file}`);
      } else {
        console.log(`📎 Referenced: ${file}`);
      }
    } catch {
      console.log(`⚠️  Could not analyze: ${file}`);
    }
    filesAnalyzed++;
  }
}

// Remove truly unused files
if (filesToRemove.length > 0) {
  console.log(
    `\n🗑️  Found ${filesToRemove.length} unused files. Remove them? (y/n)`,
  );
  // For automation, we'll skip deletion and just report
  console.log("Files that could be removed:");
  filesToRemove.forEach((file) => console.log(`  - ${file}`));
}

// Check public/_redirects for netlify-specific markdown errors
const redirectsFile = path.join(rootDir, "public/_redirects");
if (fs.existsSync(redirectsFile)) {
  let content = fs.readFileSync(redirectsFile, "utf8");
  // This file shouldn't be treated as markdown, remove markdown-specific content
  if (content.includes("#")) {
    console.log(
      "⚠️  public/_redirects contains markdown-like content but should be plain text",
    );
  }
}

console.log(`\n📊 Summary:`);
console.log(`Markdown files fixed: ${mdFixed}`);
console.log(`Files analyzed: ${filesAnalyzed}`);
console.log(`Potentially unused files: ${filesToRemove.length}`);

console.log("\n🎉 Project cleanup analysis complete!");
console.log("\nNext steps:");
console.log("1. Review the potentially unused files listed above");
console.log("2. Remove unused dependencies with: npm uninstall <package>");
console.log("3. Run npm run lint to verify fixes");
