/**
 * Cloud Supabase defaults for dev/ops scripts — projectId from config/supabase-cloud.json.
 * Anon key only via env (.env.local): VISUDEV_CLOUD_ANON_KEY or VITE_SUPABASE_ANON_KEY.
 */
const fs = require("fs");
const path = require("path");
const { validateProjectRef, validateJwt } = require("./env-value-validator");

const CONFIG_PATH = path.join(__dirname, "../../config/supabase-cloud.json");

/**
 * @param {{ fs?: typeof fs, env?: NodeJS.ProcessEnv, configPath?: string }} [deps]
 */
function createCloudSupabaseConfigReader(deps = {}) {
  const fsImpl = deps.fs ?? fs;
  const env = deps.env ?? process.env;
  const configPath = deps.configPath ?? CONFIG_PATH;

  function readCloudAnonKeyFromEnv() {
    const candidates = [
      env.VISUDEV_CLOUD_ANON_KEY?.trim(),
      env.VITE_SUPABASE_ANON_KEY?.trim(),
    ].filter(Boolean);

    for (const key of candidates) {
      if (validateJwt(key)) return key;
    }
    return null;
  }

  function readCloudSupabaseConfig() {
    const envRef = env.VISUDEV_CLOUD_PROJECT_REF?.trim();
    if (envRef && !validateProjectRef(envRef)) {
      throw new Error(
        "VISUDEV_CLOUD_PROJECT_REF has invalid format (expected 10–32 lowercase alphanumerics).",
      );
    }

    const envAnonKey = readCloudAnonKeyFromEnv();
    if (envRef && envAnonKey) {
      return { projectRef: envRef, anonKey: envAnonKey };
    }

    let parsed;
    try {
      parsed = JSON.parse(fsImpl.readFileSync(configPath, "utf8"));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read ${configPath}: ${msg}`);
    }

    const projectRef = (envRef || parsed?.projectId || "").trim();
    if (!validateProjectRef(projectRef)) {
      throw new Error("Cloud Supabase projectId missing or invalid in config/supabase-cloud.json");
    }

    const anonKey = envAnonKey;
    if (!anonKey) {
      throw new Error(
        "Cloud anon key missing. Set VISUDEV_CLOUD_ANON_KEY or VITE_SUPABASE_ANON_KEY in .env.local — see .env.cloud.example",
      );
    }

    return { projectRef, anonKey };
  }

  return { readCloudSupabaseConfig };
}

const { readCloudSupabaseConfig } = createCloudSupabaseConfigReader();

module.exports = { createCloudSupabaseConfigReader, readCloudSupabaseConfig };
