import { getBuildRuntimeDeps } from "./build-runtime-deps.js";
import { redactRuntimeOutput } from "./build-runtime-redact.js";

function effectiveStartCommand(startCommand, port) {
  const cmd = (startCommand || "").trim();
  if (cmd.includes("--port")) return cmd;
  if (/^(npm|pnpm|yarn)\s+run\s+dev(\s|$)/.test(cmd)) {
    return `${cmd} -- --host 127.0.0.1 --port ${port}`;
  }
  if (/^(npm|pnpm|yarn)\s+run\s+start(\s|$)/.test(cmd)) {
    return `${cmd} -- --port ${port}`;
  }
  if (/^\s*npx\s+vite\s/.test(cmd)) {
    return `${cmd} --host 127.0.0.1 --port ${port}`;
  }
  return cmd;
}

export function startApp(workspaceDir, port, config) {
  const runtimeDeps = getBuildRuntimeDeps();
  const {
    env: previewEnv,
    injectedKeys,
    placeholderMode,
    supabaseDetected,
  } = runtimeDeps.resolveStartEnv(workspaceDir, config);
  const env = { ...runtimeDeps.env(), ...previewEnv, PORT: String(port) };
  const command = effectiveStartCommand(config.startCommand, port);
  const isWin = runtimeDeps.platform() === "win32";
  const child = runtimeDeps.spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
    cwd: workspaceDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.__visudevInjectedEnvKeys = injectedKeys;
  child.__visudevSupabasePlaceholderMode = placeholderMode;
  child.__visudevSupabaseDetected = supabaseDetected;
  child.stdout?.on("data", (d) => {
    const redacted = redactRuntimeOutput(d.toString(), env);
    runtimeDeps.stdoutWrite(`[preview ${port}] ${redacted}`);
  });
  child.stderr?.on("data", (d) => {
    const redacted = redactRuntimeOutput(d.toString(), env);
    runtimeDeps.stderrWrite(`[preview ${port}] ${redacted}`);
  });
  child.on("error", (err) => {
    const message = err instanceof Error ? err.message : String(err);
    runtimeDeps.error(`[preview ${port}] error: ${redactRuntimeOutput(message, env)}`);
  });
  return child;
}
