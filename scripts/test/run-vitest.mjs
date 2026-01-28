#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bin = resolve(
  __dirname,
  "..",
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vitest.cmd" : "vitest",
);

process.env.VITEST_MIN_THREADS ??= "1";
process.env.VITEST_MAX_THREADS ??= "1";

const argv = process.argv.slice(2);
let command = "run";
if (argv.length && !argv[0].startsWith("-")) {
  command = argv.shift();
}

const child = spawn(bin, [command, ...argv], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => {
  process.exit(code ?? 0);
});
