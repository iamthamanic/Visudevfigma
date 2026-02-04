#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Startet den Preview-Runner mit USE_REAL_BUILD=1 (echter Build).
 * So kommt die Umgebungsvariable garantiert an, unabhängig von der Shell.
 */
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const runnerDir = path.join(projectRoot, "preview-runner");
const runnerPath = path.join(runnerDir, "index.js");

const env = { ...process.env, USE_REAL_BUILD: "1" };

const child = spawn(process.execPath, [runnerPath], {
  cwd: runnerDir,
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
