/**
 * Env value validation for dev scripts.
 * Location: scripts/lib/env-value-validator.js
 */

/** Keys dev scripts may load from .env.local */
const ALLOWED_ENV_KEYS = new Set([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_PREVIEW_RUNNER_URL",
  "VITE_LOGS_RUNNER_URL",
  "VITE_DEMO_AUTH_EMAIL",
  "VITE_DEMO_AUTH_PASSWORD",
  "VISUDEV_CLOUD_PROJECT_REF",
  "VISUDEV_CLOUD_ANON_KEY",
]);

const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const PROJECT_REF_PATTERN = /^[a-z0-9]{10,32}$/;

function validateEnvValue(key, value) {
  if (!value) return false;

  switch (key) {
    case "VITE_SUPABASE_URL":
    case "VITE_PREVIEW_RUNNER_URL":
    case "VITE_LOGS_RUNNER_URL": {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }
    case "VITE_SUPABASE_ANON_KEY":
    case "VISUDEV_CLOUD_ANON_KEY":
      return JWT_PATTERN.test(value);
    case "VISUDEV_CLOUD_PROJECT_REF":
      return PROJECT_REF_PATTERN.test(value);
    case "VITE_DEMO_AUTH_EMAIL":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "VITE_DEMO_AUTH_PASSWORD":
      return typeof value === "string" && value.length >= 8;
    default:
      return false;
  }
}

function validateProjectRef(value) {
  return typeof value === "string" && PROJECT_REF_PATTERN.test(value.trim());
}

function validateJwt(value) {
  return typeof value === "string" && JWT_PATTERN.test(value.trim());
}

function isAllowedEnvKey(key) {
  return ENV_KEY_PATTERN.test(key) && ALLOWED_ENV_KEYS.has(key);
}

module.exports = {
  ALLOWED_ENV_KEYS,
  validateEnvValue,
  validateProjectRef,
  validateJwt,
  isAllowedEnvKey,
};
