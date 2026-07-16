/**
 * Local Blueprint analysis via filesystem walk + Deno CLI pipeline.
 * Location: preview-runner/lib/blueprint-local.js
 */

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveValidatedLocalPath } from "./local-path-security.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");
const ANALYZER_DIR = join(REPO_ROOT, "src/supabase/functions/visudev-analyzer");
const CLI_SCRIPT = join(ANALYZER_DIR, "module/blueprint/cli/analyze-local.ts");

const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".qa",
  ".turbo",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
]);

/** JS/TS plus Python (Django) and Prisma schema for Softort monorepo truth. */
const SUPPORTED_EXT = new Set(["ts", "tsx", "js", "jsx", "vue", "py", "prisma"]);
const FILE_LIMIT = Math.max(250, Number(process.env.BLUEPRINT_FILE_LIMIT) || 400);
const MAX_WALK_CANDIDATES = Math.max(2000, Number(process.env.BLUEPRINT_MAX_WALK) || 4000);
const MAX_FILE_BYTES = 512 * 1024;
const MAX_STDIN_BYTES = 8 * 1024 * 1024;
const DENO_TIMEOUT_MS = Math.max(30_000, Number(process.env.BLUEPRINT_DENO_TIMEOUT_MS) || 120_000);
const MAX_CONCURRENT_ANALYZE = Math.max(1, Number(process.env.BLUEPRINT_MAX_CONCURRENT) || 2);

let activeAnalyzeCount = 0;

function prioritizeBlueprintFiles(files) {
  const score = (p) => {
    const path = p.toLowerCase();
    if (/(?:^|\/)schema\.prisma$/.test(path) || path.endsWith(".prisma")) return 100;
    if (/(?:^|\/)manage\.py$/.test(path)) return 99;
    if (/(?:^|\/)urls\.py$/.test(path)) return 98;
    if (/(?:^|\/)(views|viewsets|serializers)\.py$/.test(path)) return 96;
    if (path.includes("supabase/functions")) return 95;
    if (/(?:^|\/)route\.(tsx?|jsx?)$/.test(path)) return 94;
    if (/(?:^|\/)pages\/api\//.test(path)) return 90;
    if (/(?:^|\/)(models|permissions|settings)\.py$/.test(path)) return 88;
    if (path.includes("/apps/meteor/") || path.includes("/apps/api/")) return 86;
    if (path.includes("/validators/")) return 85;
    if (path.includes("/repositories/") || path.includes("/packages/database/")) return 80;
    if (path.includes("/services/")) return 75;
    if (path.includes("/middleware")) return 70;
    if (path.includes("/routes/") || path.includes("/api/")) return 65;
    if (path.endsWith(".py")) return 55;
    if (path.includes("server/")) return 60;
    return 0;
  };
  return [...files].sort((a, b) => score(b) - score(a));
}

function logBlueprintSkip(kind, detail) {
  console.warn(`[blueprint-local] ${kind}: ${detail}`);
}

function walkCodeFiles(rootDir) {
  const results = [];
  const stack = [rootDir];

  while (stack.length > 0 && results.length < MAX_WALK_CANDIDATES) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      logBlueprintSkip("skip directory", error instanceof Error ? error.message : "read failed");
      continue;
    }
    for (const entry of entries) {
      if (results.length >= MAX_WALK_CANDIDATES) break;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = entry.name.split(".").pop()?.toLowerCase();
      if (!ext || !SUPPORTED_EXT.has(ext)) continue;
      results.push(full);
    }
  }

  return results;
}

/**
 * Blueprint analysis walks the clone root — not the preview "best web package".
 * Preview start still uses resolveAppWorkspaceDir; Softort needs FE+BE+packages.
 */
function resolveWorkspaceRoot(localPath) {
  return localPath;
}

/** Exported for unit tests (monorepo root must stay clone root). */
export { resolveWorkspaceRoot, prioritizeBlueprintFiles, SUPPORTED_EXT, FILE_LIMIT };

function collectFileEntries(workspaceRoot) {
  const absolutePaths = walkCodeFiles(workspaceRoot);
  const prioritized = prioritizeBlueprintFiles(
    absolutePaths.map((abs) => relative(workspaceRoot, abs).replace(/\\/g, "/")),
  ).slice(0, FILE_LIMIT);

  const entries = [];
  for (const relPath of prioritized) {
    const abs = join(workspaceRoot, relPath);
    try {
      const stat = statSync(abs);
      if (!stat.isFile()) continue;
      if (stat.size > MAX_FILE_BYTES) {
        logBlueprintSkip("skip large file", `${relPath} (${stat.size} bytes)`);
        continue;
      }
      const content = readFileSync(abs, "utf8");
      entries.push({ path: relPath, content });
    } catch (error) {
      logBlueprintSkip(
        "skip unreadable file",
        `${relPath}: ${error instanceof Error ? error.message : "read failed"}`,
      );
    }
  }
  return entries;
}

function localCommitSha(localPath) {
  return createHash("sha256").update(localPath).digest("hex").slice(0, 12);
}

function runDenoAnalyze(payload) {
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, "utf8") > MAX_STDIN_BYTES) {
    return Promise.reject(new Error("Blueprint payload too large after file collection"));
  }

  return new Promise((resolve, reject) => {
    const child = spawn("deno", ["run", "--quiet", "--no-prompt", CLI_SCRIPT], {
      cwd: ANALYZER_DIR,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      const err = new Error(`Blueprint analysis timed out after ${DENO_TIMEOUT_MS}ms`);
      err.statusCode = 504;
      finish(reject, err);
    }, DENO_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        const missing = new Error("Deno nicht gefunden. Bitte deno installieren (Hybrid-Dev).");
        missing.statusCode = 503;
        finish(reject, missing);
        return;
      }
      finish(reject, err);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        finish(reject, new Error(stderr.trim() || `Deno CLI exit ${code ?? "?"}`));
        return;
      }
      try {
        finish(resolve, JSON.parse(stdout));
      } catch {
        finish(reject, new Error("Blueprint CLI returned invalid JSON"));
      }
    });

    child.stdin.write(serialized);
    child.stdin.end();
  });
}

/**
 * @param {{ localPath: unknown, projectId: unknown }} input
 */
export function validateBlueprintAnalyzeInput(input) {
  const localPath = typeof input.localPath === "string" ? input.localPath.trim() : "";
  const projectId = typeof input.projectId === "string" ? input.projectId.trim() : "";
  if (!localPath) {
    return { ok: false, statusCode: 400, error: "localPath is required" };
  }
  if (!projectId || !PROJECT_ID_PATTERN.test(projectId)) {
    return {
      ok: false,
      statusCode: 400,
      error: "projectId must match [A-Za-z0-9_-]{1,64}",
    };
  }
  return { ok: true, localPath, projectId };
}

/**
 * @param {{ localPath: string, projectId: string }} input
 */
export async function analyzeLocalBlueprint(input) {
  if (activeAnalyzeCount >= MAX_CONCURRENT_ANALYZE) {
    const err = new Error("Too many concurrent blueprint analyses. Retry shortly.");
    err.statusCode = 429;
    throw err;
  }

  activeAnalyzeCount += 1;
  try {
    const validated = resolveValidatedLocalPath(input.localPath);
    if (!validated.ok) {
      const err = new Error(validated.error);
      err.statusCode = 403;
      throw err;
    }

    const workspaceRoot = resolveWorkspaceRoot(validated.path);
    const files = collectFileEntries(workspaceRoot);
    if (files.length === 0) {
      const err = new Error("No analyzable source files found in local project path");
      err.statusCode = 400;
      throw err;
    }

    const localPath = validated.path;
    const projectId = input.projectId;

    const result = await runDenoAnalyze({
      projectId,
      localPath,
      repo: `local:${localPath}`,
      branch: "local",
      files,
      fileLimit: FILE_LIMIT,
    });

    if (!result?.blueprint) {
      throw new Error("Blueprint CLI returned no blueprint");
    }

    result.blueprint.commitSha = localCommitSha(localPath);
    return {
      blueprint: result.blueprint,
      analysisId: result.analysisId ?? randomUUID(),
      filesAnalyzed: files.length,
      workspaceRoot,
    };
  } finally {
    activeAnalyzeCount = Math.max(0, activeAnalyzeCount - 1);
  }
}
