import fs from "node:fs";
import { execSync } from "node:child_process";

const files = [
  "PRODUCTION-READINESS-REPORT.md",
  "DEPLOYMENT-GATE-FINAL.md",
];

const sectionRegex = /## Last Verified[\s\S]*?(?:\n## |\n# |\n---|$)/i;
const dateRegex = /Verification Date\/Time\s*\(.*\):\s*(.+)/i;
const commitRegex = /Verified Commit:\s*([0-9a-f]{7,40})/i;

const errors = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const sectionMatch = content.match(sectionRegex);
  if (!sectionMatch) {
    errors.push(`${file}: missing 'Last Verified' block`);
    continue;
  }

  const section = sectionMatch[0];
  const normalizedSection = section.replace(/\*\*/g, "");
  const dateMatch = normalizedSection.match(dateRegex);
  const commitMatch = normalizedSection.match(commitRegex);

  if (!dateMatch?.[1]?.trim()) {
    errors.push(`${file}: missing Verification Date/Time in 'Last Verified' block`);
  }

  if (!commitMatch?.[1]) {
    errors.push(`${file}: missing Verified Commit in 'Last Verified' block`);
  } else {
    try {
      // AI: rationale — ensure docs reference a real git commit for auditability.
      execSync(`git rev-parse --verify ${commitMatch[1]}^{commit}`, {
        stdio: "ignore",
      });
    } catch {
      errors.push(`${file}: Verified Commit not found: ${commitMatch[1]}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Evidence stamp check failed:\n" + errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}

console.log("Evidence stamp check passed for:");
for (const file of files) {
  console.log(`- ${file}`);
}
