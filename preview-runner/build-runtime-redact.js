const SENSITIVE_ENV_KEY_PATTERN = /(token|secret|password|apikey|api_key|service_role|anon_key)/i;
const LONG_SECRET_PATTERN = /[A-Za-z0-9+/_=-]{32,}/g;

function collectSensitiveValues(env = {}) {
  const values = [];
  for (const [key, value] of Object.entries(env)) {
    if (!SENSITIVE_ENV_KEY_PATTERN.test(key)) continue;
    const normalized = String(value || "").trim();
    if (normalized.length < 8) continue;
    values.push(normalized);
  }
  return values;
}

function redactKnownValues(text, values) {
  let output = text;
  for (const value of values) {
    if (!value) continue;
    output = output.split(value).join("[REDACTED]");
  }
  return output;
}

export function redactRuntimeOutput(text, env = {}) {
  const source = typeof text === "string" ? text : String(text ?? "");
  if (!source) return "";
  const knownSecrets = collectSensitiveValues(env);
  const withKnownSecretsRedacted = redactKnownValues(source, knownSecrets);
  return withKnownSecretsRedacted.replace(LONG_SECRET_PATTERN, (candidate) => {
    if (candidate.length < 32) return candidate;
    return "[REDACTED]";
  });
}
