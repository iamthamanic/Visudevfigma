#!/usr/bin/env node
/**
 * CLI for Supabase ↔ local project migration via Local Engine API.
 * Location: scripts/migration/visudev-migrate.mjs
 *
 * Usage:
 *   node scripts/migration/visudev-migrate.mjs export-local --project-id=<id> --out=bundle.json
 *   node scripts/migration/visudev-migrate.mjs import-local --file=bundle.json
 *   node scripts/migration/visudev-migrate.mjs export-supabase --project-id=<id> --out=bundle.json
 *   node scripts/migration/visudev-migrate.mjs import-supabase --file=bundle.json --access-token=<jwt>
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { applyEnvFile } = require("../lib/load-env-file.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (const entry of rest) {
    if (!entry.startsWith("--")) continue;
    const [key, value = "true"] = entry.slice(2).split("=");
    flags[key] = value;
  }
  return { command, flags };
}

function engineUrl(flags) {
  return (
    flags["engine-url"] ||
    process.env.VITE_VISUDEV_ENGINE_URL ||
    "http://127.0.0.1:4317"
  ).replace(/\/$/, "");
}

function supabaseUrl(flags) {
  return flags["supabase-url"] || process.env.VITE_SUPABASE_URL || "";
}

async function engineRequest(base, pathname, init) {
  const response = await fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Engine returned invalid JSON (${response.status})`);
  }
  if (!response.ok || !payload?.ok) {
    const message = payload?.error?.message || `Engine request failed (${response.status})`;
    throw new Error(message);
  }
  return payload.data;
}

async function readBundle(filePath) {
  const raw = await fs.readFile(path.resolve(filePath), "utf8");
  return JSON.parse(raw);
}

async function writeBundle(filePath, bundle) {
  const target = path.resolve(filePath);
  await fs.writeFile(target, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  return target;
}

async function main() {
  await applyEnvFile(path.join(ROOT, ".env"));
  await applyEnvFile(path.join(ROOT, ".env.local"));
  const { command, flags } = parseArgs(process.argv.slice(2));
  const base = engineUrl(flags);

  switch (command) {
    case "export-local": {
      const projectId = flags["project-id"];
      if (!projectId) throw new Error("--project-id is required");
      const result = await engineRequest(
        base,
        `/api/migration/export/local/${encodeURIComponent(projectId)}`,
      );
      const out = flags.out || `visudev-export-${projectId}.json`;
      const written = await writeBundle(out, result.bundle);
      console.log(`Exported local project ${projectId} → ${written}`);
      break;
    }
    case "import-local": {
      const file = flags.file;
      if (!file) throw new Error("--file is required");
      const bundle = await readBundle(file);
      const result = await engineRequest(base, "/api/migration/import/local", {
        method: "POST",
        body: JSON.stringify({ bundle }),
      });
      console.log(`Imported bundle → local project ${result.projectId}`);
      if (result.importedArtifacts?.length) {
        console.log(`Artifacts: ${result.importedArtifacts.join(", ")}`);
      }
      break;
    }
    case "export-supabase": {
      const projectId = flags["project-id"];
      const url = supabaseUrl(flags);
      if (!projectId || !url) {
        throw new Error("--project-id and --supabase-url (or VITE_SUPABASE_URL) are required");
      }
      const result = await engineRequest(base, "/api/migration/export/supabase", {
        method: "POST",
        body: JSON.stringify({
          supabaseUrl: url,
          projectId,
          accessToken: flags["access-token"] || process.env.SUPABASE_ACCESS_TOKEN,
          anonKey: flags["anon-key"] || process.env.VITE_SUPABASE_ANON_KEY,
        }),
      });
      const out = flags.out || `visudev-export-${projectId}.json`;
      const written = await writeBundle(out, result.bundle);
      console.log(`Exported Supabase project ${projectId} → ${written}`);
      break;
    }
    case "import-supabase": {
      const file = flags.file;
      const url = supabaseUrl(flags);
      const accessToken = flags["access-token"] || process.env.SUPABASE_ACCESS_TOKEN;
      if (!file || !url || !accessToken) {
        throw new Error(
          "--file, --supabase-url, and --access-token (or SUPABASE_ACCESS_TOKEN) are required",
        );
      }
      const bundle = await readBundle(file);
      const result = await engineRequest(base, "/api/migration/import/supabase", {
        method: "POST",
        body: JSON.stringify({ bundle, supabaseUrl: url, accessToken }),
      });
      console.log(`Imported bundle → Supabase project ${result.projectId}`);
      if (result.importedArtifacts?.length) {
        console.log(`Artifacts: ${result.importedArtifacts.join(", ")}`);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${command ?? "(none)"}`);
      console.error("Commands: export-local | import-local | export-supabase | import-supabase");
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
