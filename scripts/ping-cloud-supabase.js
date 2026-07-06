#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Keep Supabase Cloud project awake (Free tier pauses after ~7 days inactivity).
 * Location: scripts/ping-cloud-supabase.js
 */
const path = require("path");
const { applyEnvFile } = require("./lib/load-env-file");
const { readCloudSupabaseConfig } = require("./lib/cloud-supabase-config");
const { validateProjectRef, validateJwt } = require("./lib/env-value-validator");

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {{ fetch?: typeof fetch, readConfig?: () => { projectRef: string, anonKey: string } }} [deps]
 * @returns {Promise<{ ok: true, projectRef: string, status: number } | { ok: false, projectRef: string, status?: number, error?: string }>}
 */
async function pingCloudSupabase(deps = {}) {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const readConfig = deps.readConfig ?? readCloudSupabaseConfig;

  const { projectRef, anonKey } = readConfig();

  if (!validateProjectRef(projectRef)) {
    return { ok: false, projectRef: projectRef ?? "", error: "Invalid cloud projectRef format" };
  }
  if (!validateJwt(anonKey)) {
    return { ok: false, projectRef, error: "Invalid cloud anon key format" };
  }

  const safeRef = encodeURIComponent(projectRef);
  const url = `https://${safeRef}.supabase.co/rest/v1/kv_store_edf036ef?select=key&limit=1`;

  let response;
  try {
    response = await fetchFn(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
  } catch (error) {
    return { ok: false, projectRef, error: errorMessage(error) };
  }

  if (response.status === 200) {
    return { ok: true, projectRef, status: response.status };
  }

  return { ok: false, projectRef, status: response.status };
}

async function main() {
  applyEnvFile(path.join(__dirname, "../.env.local"));
  const result = await pingCloudSupabase();

  if (result.ok) {
    console.log(`[ping-cloud] OK (${result.projectRef}, HTTP ${result.status})`);
    process.exit(0);
  }

  if (result.error) {
    console.error(`[ping-cloud] Network error: ${result.error}`);
    process.exit(1);
  }

  console.error(
    `[ping-cloud] WARN: Cloud ping failed (HTTP ${result.status ?? "?"}). Project may be paused — restore in Dashboard.`,
  );
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { pingCloudSupabase };
