/**
 * Minimal .env line parser for dev scripts (no dotenv dependency).
 * Location: scripts/lib/env-file-parser.js
 */
const fs = require("fs");
const path = require("path");

const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function stripInlineComment(rawValue) {
  if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
    return rawValue;
  }
  const hashIdx = rawValue.indexOf(" #");
  return hashIdx === -1 ? rawValue : rawValue.slice(0, hashIdx).trim();
}

function unquoteValue(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  if (value.includes('"') || value.includes("'")) {
    return null;
  }
  return value;
}

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function parseEnvFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return {};

  const vars = {};
  const lines = fs.readFileSync(resolved, "utf8").split("\n");

  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    const trimmed = lines[lineNo].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      console.warn(`[env-file-parser] Ignoring invalid line ${lineNo + 1}: missing '='`);
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    if (!ENV_KEY_PATTERN.test(key)) {
      console.warn(`[env-file-parser] Ignoring invalid key on line ${lineNo + 1}: ${key}`);
      continue;
    }

    const rawValue = stripInlineComment(trimmed.slice(eq + 1).trim());
    const value = unquoteValue(rawValue);
    if (value == null) {
      console.warn(`[env-file-parser] Ignoring malformed quoted value on line ${lineNo + 1}`);
      continue;
    }
    if (value.includes("\n")) {
      console.warn(`[env-file-parser] Ignoring multiline value on line ${lineNo + 1}`);
      continue;
    }

    vars[key] = value;
  }
  return vars;
}

module.exports = { parseEnvFile };
