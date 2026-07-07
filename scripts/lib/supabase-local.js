/**
 * Local Supabase helpers for hybrid dev scripts.
 */
const http = require("http");
const https = require("https");

function isLocalSupabaseUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const { hostname } = new URL(url.trim());
    const host = hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function defaultLocalSupabaseUrl() {
  return "http://127.0.0.1:54321";
}

function healthUrlForSupabase(baseUrl) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new Error("healthUrlForSupabase: baseUrl must be a non-empty string");
  }
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return `${trimmed}/functions/v1/visudev-auth/health`;
}

function checkHttpOk(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      finish(false);
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      finish(false);
      return;
    }

    const client = parsed.protocol === "https:" ? https : http;
    let req;
    try {
      req = client.get(url, (res) => {
        const ok = res.statusCode === 200;
        res.resume();
        res.on("error", () => finish(false));
        res.on("end", () => finish(ok));
      });
    } catch {
      finish(false);
      return;
    }
    req.on("error", () => finish(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      finish(false);
    });
  });
}

async function waitForSupabaseHealth(baseUrl, options = {}) {
  const maxAttempts = options.maxAttempts ?? 30;
  const intervalMs = options.intervalMs ?? 1000;
  let healthUrl;
  try {
    healthUrl = healthUrlForSupabase(baseUrl);
  } catch (error) {
    console.error("[supabase-local]", error instanceof Error ? error.message : String(error));
    return false;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkHttpOk(healthUrl, 4000);
    if (ok) return true;
    if (attempt < maxAttempts) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  return false;
}

module.exports = {
  isLocalSupabaseUrl,
  defaultLocalSupabaseUrl,
  healthUrlForSupabase,
  checkHttpOk,
  waitForSupabaseHealth,
};
