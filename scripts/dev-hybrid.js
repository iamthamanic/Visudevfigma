#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Hybrid dev CLI entry — guards, env prep, delegate to orchestrator.
 * Location: scripts/dev-hybrid.js
 */
const path = require("path");
const { applyEnvFile } = require("./lib/load-env-file");
const { createHybridProcessGuards } = require("./lib/hybrid-process-guards");
const {
  prepareHybridDevEnv,
  startHybridDevServers,
  healthUrlForSupabase,
} = require("./lib/hybrid-dev-orchestrator");

const ROOT = path.join(__dirname, "..");

const { registerChild, shutdownAll, isShuttingDown, installProcessGuards } =
  createHybridProcessGuards();

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function fail(message, exitCode = 1) {
  console.error(`[dev-hybrid] ${message}`);
  shutdownAll("SIGTERM");
  process.exit(exitCode);
}

async function main() {
  installProcessGuards();
  applyEnvFile(path.join(ROOT, ".env.local"));

  const prep = prepareHybridDevEnv();
  if (!prep.ok) fail(prep.error, prep.exitCode ?? 1);

  if (prep.startedStack) {
    console.log("[dev-hybrid] Lokaler Supabase-Stack nicht aktiv — starte supabase start …");
  }

  Object.assign(process.env, prep.env);
  console.log(`[dev-hybrid] VITE_SUPABASE_URL=${prep.env.VITE_SUPABASE_URL}`);
  console.log("[dev-hybrid] Starte supabase functions serve …");
  console.log(`[dev-hybrid] Warte auf ${healthUrlForSupabase(prep.env.VITE_SUPABASE_URL)} …`);

  const result = await startHybridDevServers({
    env: process.env,
    registerChild,
    isShuttingDown,
    onHealthOk: () => console.log("[dev-hybrid] Supabase Auth health OK."),
  });

  shutdownAll("SIGTERM");
  if (!result.ok) fail(result.error, result.exitCode ?? 1);
  process.exit(result.exitCode);
}

main().catch((err) => {
  fail(`Fehler: ${errorMessage(err)}`);
});
