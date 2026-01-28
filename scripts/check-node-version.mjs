#!/usr/bin/env node
const semver = process.versions.node;
const [majorStr, minorStr] = semver.split(".");
const major = Number(majorStr);
const minor = Number(minorStr);

const MIN_MAJOR = 22;
const MAX_MAJOR_EXCLUSIVE = 23;

if (Number.isNaN(major) || Number.isNaN(minor)) {
  console.warn(
    `[runtime-check] Unable to parse Node version '${semver}'. Continuing...`,
  );
  process.exit(0);
}

if (major < MIN_MAJOR || major >= MAX_MAJOR_EXCLUSIVE) {
  console.error(`\n❌  Unsupported Node.js version ${semver}.`);
  console.error(
    `   Please use Node ${MIN_MAJOR}.x (matching Netlify & CI runtime).`,
  );
  process.exit(1);
}

if (major === MIN_MAJOR && minor < 0) {
  console.warn(
    `\n⚠️  Node ${semver} detected. Consider upgrading to the latest ${MIN_MAJOR}.x release.`,
  );
}
