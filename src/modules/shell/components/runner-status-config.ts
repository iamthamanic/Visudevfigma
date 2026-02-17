import type { PreviewRunnerRuntimeStatus } from "../../../utils/api";

export const RUNNER_POLL_MS = 15_000;

export const RUNNER_COMMANDS = [
  {
    id: "visudev",
    command: "npm run visudev",
    description: "Startet VisuDEV (Frontend + lokalen Runner).",
  },
  {
    id: "visudev-runner",
    command: "npm run visudev:runner",
    description: "Startet nur den lokalen Preview-Runner.",
  },
  {
    id: "visudev-runner-status",
    command: "npm run visudev:runner:status",
    description: "Zeigt Runner-Status, Uptime, Runs und Projekte.",
  },
  {
    id: "dev",
    command: "npm run dev",
    description: "Bestehender Standardstart (wie visudev).",
  },
] as const;

export const INITIAL_RUNNER_STATUS: PreviewRunnerRuntimeStatus = {
  state: "inactive",
  baseUrl: null,
  checkedAt: "",
  startedAt: null,
  uptimeSec: null,
  activeRuns: 0,
  projects: [],
  runs: [],
};

export function formatUptime(seconds: number | null): string {
  if (!Number.isFinite(seconds) || seconds == null || seconds < 0) return "-";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
