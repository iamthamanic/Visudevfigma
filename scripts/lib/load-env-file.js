/**
 * Apply validated .env.local vars to process.env for dev scripts.
 * Location: scripts/lib/load-env-file.js
 */
const { parseEnvFile } = require("./env-file-parser");
const {
  isAllowedEnvKey,
  validateEnvValue,
  ALLOWED_ENV_KEYS,
  validateProjectRef,
  validateJwt,
} = require("./env-value-validator");

function loadEnvFile(filePath) {
  const raw = parseEnvFile(filePath);
  const vars = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!isAllowedEnvKey(key)) {
      console.warn(`[load-env-file] Ignoring non-whitelisted key: ${key}`);
      continue;
    }
    if (!validateEnvValue(key, value)) {
      console.warn(`[load-env-file] Ignoring invalid value for ${key}`);
      continue;
    }
    vars[key] = value;
  }
  return vars;
}

/** Merge file vars into process.env when not already set. */
function applyEnvFile(filePath) {
  const vars = loadEnvFile(filePath);
  for (const [key, value] of Object.entries(vars)) {
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
  return vars;
}

module.exports = {
  loadEnvFile,
  applyEnvFile,
  ALLOWED_ENV_KEYS,
  validateEnvValue,
  validateProjectRef,
  validateJwt,
};
