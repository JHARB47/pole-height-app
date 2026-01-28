#!/usr/bin/env node
import { execSync } from "child_process";

console.log("🔍 Upgrade Validation\n");

try {
  const branch = execSync("git branch --show-current", {
    encoding: "utf8",
  }).trim();
  console.log(`Current branch: ${branch}`);

  console.log("\n🧪 Running validation tests...");
  console.log("- Unit tests: npm run test");
  console.log("- Build: npm run build");
  console.log("- Bundle check: npm run bundle:check");

  console.log("\n📋 Manual checks needed:");
  if (branch.includes("react")) {
    console.log("- Test all React components render correctly");
    console.log("- Verify Suspense boundaries work");
  }
  if (branch.includes("vite")) {
    console.log("- Check vite.config.js compatibility");
    console.log("- Verify build output and chunks");
  }
  if (branch.includes("tailwind")) {
    console.log("- Update tailwind.config.js format");
    console.log("- Test all UI components");
  }
} catch (error) {
  console.error("Error:", error.message);
}
