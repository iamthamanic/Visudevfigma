import { spawn } from "node:child_process";
import { existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { warnNonFatal } from "./build-logging.js";

const GIT_LOCK_MAX_AGE_MS = 5 * 60 * 1000;
const KNOWN_GIT_CANDIDATES = ["/usr/bin/git", "/opt/homebrew/bin/git", "/usr/local/bin/git"];
const GIT_SUBCOMMANDS = new Set(["clone", "fetch", "checkout", "pull", "rev-parse", "rev-list"]);

function resolveGitBinary() {
  const explicit = process.env.SHIM_GIT_REAL_BIN;
  if (explicit && existsSync(explicit)) return explicit;

  const pathEntries = String(process.env.PATH || "")
    .split(":")
    .filter(Boolean);
  for (const dir of pathEntries) {
    if (dir.includes("/.local/bin")) continue;
    const candidate = join(dir, "git");
    if (existsSync(candidate)) return candidate;
  }

  for (const candidate of KNOWN_GIT_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return "git";
}

function getCloneUrl(repo) {
  const token = process.env.GITHUB_TOKEN;
  const base = `https://github.com/${repo}.git`;
  if (token && token.trim()) {
    return base.replace("https://", `https://x-access-token:${token.trim()}@`);
  }
  return base;
}

function runGit(cwd, args, env = {}) {
  const list = Array.isArray(args) ? args.filter((a) => a != null && a !== "") : [];
  if (list.length === 0 || !GIT_SUBCOMMANDS.has(String(list[0]))) {
    throw new Error(
      "runGit: args must be a non-empty array with a valid subcommand (e.g. clone, fetch, pull)",
    );
  }
  const gitBinary = resolveGitBinary();
  return new Promise((resolve, reject) => {
    const child = spawn(gitBinary, list, {
      cwd,
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
      else reject(new Error(stderr || stdout || `git exit ${code}`));
    });
    child.on("error", reject);
  });
}

function getGitLockPath(workspaceDir) {
  return join(workspaceDir, ".git", "index.lock");
}

function removeStaleGitLock(workspaceDir, maxAgeMs = GIT_LOCK_MAX_AGE_MS) {
  if (!workspaceDir) return false;
  const lockPath = getGitLockPath(workspaceDir);
  if (!existsSync(lockPath)) return false;
  try {
    const stats = statSync(lockPath);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < maxAgeMs) return false;
    unlinkSync(lockPath);
    console.warn(`  [git] Removed stale index.lock (${Math.round(ageMs / 1000)}s old).`);
    return true;
  } catch (error) {
    warnNonFatal(`removeStaleGitLock failed (${lockPath})`, error);
    return false;
  }
}

function isGitLockError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("index.lock");
}

export async function cloneOrPull(repo, branch, workspaceDir) {
  if (!repo || typeof repo !== "string" || !repo.includes("/")) {
    throw new Error("Ungültiges Repo-Format: erwartet 'owner/repo'");
  }
  if (!workspaceDir || typeof workspaceDir !== "string") {
    throw new Error("Workspace-Pfad fehlt oder ist ungültig");
  }
  const url = getCloneUrl(repo);
  let branchSafe = (branch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "") || "main";
  branchSafe = branchSafe.replace(/^-+/, "") || "main";

  const attempt = async () => {
    if (!existsSync(workspaceDir)) {
      const parent = join(workspaceDir, "..");
      mkdirSync(parent, { recursive: true });
      await runGit(parent, ["clone", "--depth", "1", "-b", branchSafe, url, workspaceDir]);
      return "cloned";
    }

    await runGit(workspaceDir, ["fetch", "origin", branchSafe]);
    await runGit(workspaceDir, ["checkout", branchSafe]);
    await runGit(workspaceDir, ["pull", "origin", branchSafe, "--rebase"]);
    return "pulled";
  };

  try {
    removeStaleGitLock(workspaceDir);
    return await attempt();
  } catch (err) {
    if (isGitLockError(err) && removeStaleGitLock(workspaceDir)) {
      return await attempt();
    }
    throw err;
  }
}

export async function checkoutCommit(workspaceDir, commitSha, branchForFetch) {
  if (!workspaceDir || !existsSync(workspaceDir)) {
    throw new Error("Workspace fehlt für checkoutCommit");
  }
  const sha = String(commitSha || "").trim();
  if (!/^[a-f0-9]{40}$/i.test(sha)) {
    throw new Error("commitSha muss ein 40-stelliger Hex-Hash sein");
  }
  const branchSafe = (branchForFetch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "") || "main";
  removeStaleGitLock(workspaceDir);
  try {
    await runGit(workspaceDir, ["fetch", "origin", branchSafe, "--unshallow"]);
  } catch (error) {
    warnNonFatal(`checkoutCommit: --unshallow fallback for ${workspaceDir}`, error);
    await runGit(workspaceDir, ["fetch", "origin", branchSafe]);
  }
  await runGit(workspaceDir, ["checkout", sha]);
}

export async function hasNewCommits(workspaceDir, branch) {
  if (!workspaceDir || !existsSync(workspaceDir)) return false;
  const branchSafe =
    (branch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "").replace(/^-+/, "") || "main";
  try {
    removeStaleGitLock(workspaceDir);
    await runGit(workspaceDir, ["fetch", "origin", branchSafe]);
    const { stdout } = await runGit(workspaceDir, [
      "rev-list",
      "--count",
      `HEAD..origin/${branchSafe}`,
    ]);
    return parseInt(stdout.trim(), 10) > 0;
  } catch (error) {
    warnNonFatal(`hasNewCommits failed (${workspaceDir})`, error);
    return false;
  }
}
