import { join } from "node:path";
import { getBuildRuntimeDeps } from "./build-runtime-deps.js";
import { getBuildScript, getPackageManager } from "./build-runtime-package.js";
import { runCommand, runNpm, runPnpm, runYarn } from "./build-runtime-process.js";

const NODE_BUILD_BINARIES = [
  { pattern: /^vite\s+build/i, bin: "node_modules/vite/bin/vite.js", args: "build" },
  {
    pattern: /^react-scripts\s+build/i,
    bin: "node_modules/react-scripts/bin/react-scripts.js",
    args: "build",
  },
  {
    pattern: /^vue-cli-service\s+build/i,
    bin: "node_modules/@vue/cli-service/bin/vue-cli-service.js",
    args: "build",
  },
];

async function installDeps(workspaceDir, packageManager) {
  const runtimeDeps = getBuildRuntimeDeps();
  if (packageManager === "pnpm") {
    await runPnpm(workspaceDir, ["install", "--ignore-scripts"]);
    return;
  }
  if (packageManager === "yarn") {
    await runYarn(workspaceDir, ["install", "--ignore-scripts"]);
    return;
  }
  const hasLock = runtimeDeps.existsSync(join(workspaceDir, "package-lock.json"));
  if (hasLock) {
    await runNpm(workspaceDir, ["ci", "--ignore-scripts"]);
  } else {
    await runNpm(workspaceDir, ["install", "--ignore-scripts"]);
  }
}

async function runBuildStep(workspaceDir, packageManager, script) {
  const runtimeDeps = getBuildRuntimeDeps();
  if (!script || script.includes("&&") || /^\s*npm\s*$/i.test(script) || /^npm\s+/i.test(script)) {
    if (packageManager === "pnpm") await runPnpm(workspaceDir, ["run", "build"]);
    else if (packageManager === "yarn") await runYarn(workspaceDir, ["run", "build"]);
    else await runNpm(workspaceDir, ["run", "build"]);
    return;
  }
  if (script.startsWith("echo ") || script === "echo ok") {
    if (packageManager === "pnpm") await runPnpm(workspaceDir, ["run", "build"]);
    else if (packageManager === "yarn") await runYarn(workspaceDir, ["run", "build"]);
    else await runNpm(workspaceDir, ["run", "build"]);
    return;
  }

  for (const { pattern, bin, args } of NODE_BUILD_BINARIES) {
    if (pattern.test(script)) {
      const binPath = join(workspaceDir, bin);
      if (runtimeDeps.existsSync(binPath)) {
        runtimeDeps.log("  [build] node direct:", bin, args);
        await runCommand(workspaceDir, `node ${bin} ${args}`);
        return;
      }
      break;
    }
  }

  if (packageManager === "pnpm") {
    runtimeDeps.log("  [build] pnpm run build");
    await runPnpm(workspaceDir, ["run", "build"]);
    return;
  }
  if (packageManager === "yarn") {
    runtimeDeps.log("  [build] yarn run build");
    await runYarn(workspaceDir, ["run", "build"]);
    return;
  }
  runtimeDeps.log("  [build] npx fallback:", script);
  await runCommand(workspaceDir, "npx " + script);
}

export async function runBuildNodeDirect(workspaceDir) {
  const runtimeDeps = getBuildRuntimeDeps();
  const packageManager = getPackageManager(workspaceDir);
  runtimeDeps.log("  [build] package manager:", packageManager);
  await installDeps(workspaceDir, packageManager);
  const script = getBuildScript(workspaceDir);
  await runBuildStep(workspaceDir, packageManager, script);
}

export async function runBuild(workspaceDir, config) {
  const runtimeDeps = getBuildRuntimeDeps();
  runtimeDeps.log("  [build] ", config.buildCommand);
  await runCommand(workspaceDir, config.buildCommand);
}
