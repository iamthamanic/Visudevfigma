/**
 * VisuDEV Preview Runner – Clone, Build, Start
 * Real repo clone, build, and start app on assigned port.
 * Supports refresh (git pull + rebuild + restart) for live updates.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WORKSPACE_ROOT = join(__dirname, "workspace");

function sanitizeProjectId(projectId) {
  return (
    String(projectId)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 64) || "default"
  );
}

export function getWorkspaceDir(projectId) {
  return join(WORKSPACE_ROOT, sanitizeProjectId(projectId));
}

/** Repo: "owner/repo". Returns clone URL (with token if GITHUB_TOKEN set). */
function getCloneUrl(repo) {
  const token = process.env.GITHUB_TOKEN;
  const base = `https://github.com/${repo}.git`;
  if (token && token.trim()) {
    return base.replace("https://", `https://x-access-token:${token.trim()}@`);
  }
  return base;
}

function runCommand(cwd, command, env = {}) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === "win32";
    const child = spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
      cwd,
      shell: true,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `Exit ${code}`));
    });
    child.on("error", reject);
  });
}

/** Clone repo (or pull if dir exists). Repo = "owner/repo", branch = "main" etc. */
export async function cloneOrPull(repo, branch, workspaceDir) {
  const url = getCloneUrl(repo);
  const branchSafe = (branch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "");

  if (!existsSync(workspaceDir)) {
    const parent = join(workspaceDir, "..");
    mkdirSync(parent, { recursive: true });
    await runCommand(parent, `git clone --depth 1 -b "${branchSafe}" "${url}" "${workspaceDir}"`);
    return "cloned";
  }

  await runCommand(
    workspaceDir,
    `git fetch origin "${branchSafe}" && git checkout "${branchSafe}" && git pull origin "${branchSafe}" --rebase`,
  );
  return "pulled";
}

/** Read visudev.config.json from repo root. */
export function getConfig(workspaceDir) {
  const configPath = join(workspaceDir, "visudev.config.json");
  if (!existsSync(configPath)) {
    return {
      buildCommand: "npm ci && npm run build",
      startCommand: "npx serve dist",
      port: 3000,
    };
  }
  try {
    const raw = readFileSync(configPath, "utf8");
    const config = JSON.parse(raw);
    return {
      buildCommand: config.buildCommand ?? "npm ci && npm run build",
      startCommand: config.startCommand ?? "npx serve dist",
      port: config.port ?? 3000,
    };
  } catch (e) {
    return {
      buildCommand: "npm ci && npm run build",
      startCommand: "npx serve dist",
      port: 3000,
    };
  }
}

/** Run build in workspace. */
export async function runBuild(workspaceDir, config) {
  await runCommand(workspaceDir, config.buildCommand);
}

/** Start app in workspace on given port. Returns child process. */
export function startApp(workspaceDir, port, config) {
  const env = { ...process.env, PORT: String(port) };
  const isWin = process.platform === "win32";
  const child = spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", config.startCommand], {
    cwd: workspaceDir,
    shell: true,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => process.stdout.write(`[preview ${port}] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[preview ${port}] ${d}`));
  child.on("error", (err) => console.error(`[preview ${port}] error:`, err));
  return child;
}
