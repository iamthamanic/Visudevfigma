/**
 * Child-process lifecycle guards for hybrid dev orchestration.
 * Location: scripts/lib/hybrid-process-guards.js
 */

const ALLOWED_SHUTDOWN_SIGNALS = new Set(["SIGTERM", "SIGINT", "SIGKILL"]);

function normalizeShutdownSignal(signal) {
  return typeof signal === "string" && ALLOWED_SHUTDOWN_SIGNALS.has(signal) ? signal : "SIGTERM";
}

function safeKill(child, signal) {
  if (!child || child.killed) return;
  try {
    child.kill(signal);
  } catch {
    // Child may already be gone — ignore during shutdown.
  }
}

/**
 * @param {{ process?: NodeJS.Process }} [deps]
 */
function createHybridProcessGuards(deps = {}) {
  const proc = deps.process ?? process;

  /** @type {import('child_process').ChildProcess[]} */
  const childProcesses = [];
  let shuttingDown = false;
  let disposeGuards = null;

  function registerChild(child) {
    childProcesses.push(child);
    return child;
  }

  function shutdownAll(signal = "SIGTERM") {
    if (shuttingDown) return;
    shuttingDown = true;
    const safeSignal = normalizeShutdownSignal(signal);
    for (const child of childProcesses) {
      safeKill(child, safeSignal);
    }
  }

  function isShuttingDown() {
    return shuttingDown;
  }

  function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }

  function installProcessGuards(label = "dev-hybrid") {
    if (disposeGuards) return disposeGuards;

    const onSigint = () => {
      shutdownAll("SIGINT");
      proc.exit(130);
    };
    const onSigterm = () => {
      shutdownAll("SIGTERM");
      proc.exit(143);
    };
    const onExit = () => shutdownAll("SIGTERM");
    const onUncaught = (error) => {
      console.error(`[${label}] uncaughtException: ${errorMessage(error)}`);
      shutdownAll("SIGTERM");
      proc.exit(1);
    };
    const onRejection = (reason) => {
      console.error(`[${label}] unhandledRejection: ${errorMessage(reason)}`);
      shutdownAll("SIGTERM");
      proc.exit(1);
    };

    proc.on("SIGINT", onSigint);
    proc.on("SIGTERM", onSigterm);
    proc.on("exit", onExit);
    proc.on("uncaughtException", onUncaught);
    proc.on("unhandledRejection", onRejection);

    disposeGuards = () => {
      proc.off("SIGINT", onSigint);
      proc.off("SIGTERM", onSigterm);
      proc.off("exit", onExit);
      proc.off("uncaughtException", onUncaught);
      proc.off("unhandledRejection", onRejection);
      disposeGuards = null;
    };

    return disposeGuards;
  }

  return { registerChild, shutdownAll, isShuttingDown, installProcessGuards };
}

module.exports = { createHybridProcessGuards };
