/**
 * Test: runNpm und runBuildNodeDirect ohne echten Git-Clone.
 * Erstellt ein minimales Workspace, führt npm ci --ignore-scripts und Build aus.
 * Ausführung: node test-build.mjs
 */
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getWorkspaceDir, getBuildScript, runBuildNodeDirect } from "./build.js";
import { mkdirSync } from "node:fs";

const TEST_PROJECT_ID = "test-build-" + Date.now();

async function main() {
  const workspaceDir = getWorkspaceDir(TEST_PROJECT_ID);
  const packageJson = {
    name: "test-preview-build",
    version: "1.0.0",
    private: true,
    scripts: { build: "echo build-ok" },
    dependencies: {},
  };

  console.log("1. Workspace anlegen:", workspaceDir);
  mkdirSync(workspaceDir, { recursive: true });
  writeFileSync(join(workspaceDir, "package.json"), JSON.stringify(packageJson, null, 2));

  console.log("2. npm install (für package-lock.json)");
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const c = spawn("npm", ["install"], { cwd: workspaceDir, stdio: "inherit" });
    c.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error("npm install exit " + code)),
    );
  });

  console.log("3. getBuildScript(workspaceDir):", getBuildScript(workspaceDir));

  console.log("4. runBuildNodeDirect(workspaceDir) – nutzt runNpm für npm ci und npm run build");
  await runBuildNodeDirect(workspaceDir);

  console.log("\n[OK] Alle Schritte. Aufräumen:", workspaceDir);
  rmSync(workspaceDir, { recursive: true, force: true });
  console.log("Fertig.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
