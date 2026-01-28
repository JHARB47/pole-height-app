#!/usr/bin/env node

/**
 * Monitoring Setup Test Script
 * Tests all monitoring systems after setup
 */

import { execSync } from "child_process";
import fs from "fs";

console.log("🧪 Testing PolePlan Pro Monitoring Setup\n");

// Test 1: Check environment variables
console.log("1. Checking Environment Variables...");
try {
  const envOutput = execSync("npx netlify env:list --json", {
    encoding: "utf8",
  });
  const envData = JSON.parse(envOutput);

  const requiredVars = ["VITE_SENTRY_DSN", "SENTRY_DSN", "VITE_APP_VERSION"];
  const missing = requiredVars.filter((v) => !envData.some((e) => e.key === v));

  if (missing.length > 0) {
    console.log("❌ Missing environment variables:", missing.join(", "));
    console.log("   Run the setup commands from MONITORING-SETUP-GUIDE.md");
  } else {
    console.log("✅ All required environment variables are set");
  }
} catch (error) {
  console.log("❌ Could not check environment variables:", error.message);
}

// Test 2: Test health endpoint
console.log("\n2. Testing Health Endpoint...");
try {
  const healthResponse = execSync(
    'curl -s "https://poleplanpro.com/.netlify/functions/health"',
    { encoding: "utf8" },
  );
  const healthData = JSON.parse(healthResponse);

  if (healthData.ok && healthData.performance) {
    console.log("✅ Health endpoint responding with performance metrics");
    console.log(`   Response time: ${healthData.performance.responseTimeMs}ms`);
    console.log(
      `   Memory usage: ${healthData.performance.memoryUsage.heapUsed}MB heap used`,
    );
  } else {
    console.log("❌ Health endpoint not returning expected data");
  }
} catch (error) {
  console.log("❌ Health endpoint test failed:", error.message);
}

// Test 3: Test main site
console.log("\n3. Testing Main Site...");
try {
  const siteResponse = execSync(
    'curl -s -I "https://poleplanpro.com" | head -1',
    { encoding: "utf8" },
  );

  if (siteResponse.includes("200")) {
    console.log("✅ Main site responding with HTTP 200");
  } else {
    console.log("❌ Main site not responding correctly:", siteResponse.trim());
  }
} catch (error) {
  console.log("❌ Main site test failed:", error.message);
}

// Test 4: Check if Sentry is initialized
console.log("\n4. Checking Sentry Configuration...");
try {
  // Check if Sentry DSN is in the built files
  const indexHtml = fs.readFileSync("dist/index.html", "utf8");
  if (indexHtml.includes("sentry")) {
    console.log("✅ Sentry appears to be configured in build");
  } else {
    console.log(
      "⚠️  Sentry configuration not found in build (may be runtime only)",
    );
  }
} catch (error) {
  console.log("❌ Could not check Sentry configuration:", error.message);
}

// Test 5: Performance monitoring
console.log("\n5. Testing Performance Monitoring...");
try {
  const perfResponse = execSync(
    'curl -s "https://poleplanpro.com" | grep -o "web-vitals|performance"',
    { encoding: "utf8" },
  );

  if (perfResponse.trim()) {
    console.log("✅ Performance monitoring code detected in response");
  } else {
    console.log(
      "⚠️  Performance monitoring code not detected (may load asynchronously)",
    );
  }
} catch (error) {
  console.log("❌ Performance monitoring test failed:", error.message);
}

console.log("\n📋 Next Steps:");
console.log("1. Check Sentry dashboard for error events");
console.log("2. Verify Netlify Analytics is collecting data");
console.log("3. Test UptimeRobot monitoring");
console.log("4. Set up alert rules in Sentry");
console.log("5. Monitor Core Web Vitals in browser dev tools");

console.log("\n🔗 Useful Links:");
console.log("- Sentry Dashboard: https://sentry.io");
console.log(
  "- Netlify Analytics: https://app.netlify.com/sites/poleplanpro/analytics",
);
console.log("- UptimeRobot: https://uptimerobot.com");
console.log(
  "- Health Check: https://poleplanpro.com/.netlify/functions/health",
);
