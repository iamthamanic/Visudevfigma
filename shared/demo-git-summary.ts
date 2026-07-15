/**
 * Demo GitSummary fixture for evolution view / E2E (HR-tool timeline).
 */

import type { GitSummary } from "./visudev-api.types.js";

export function buildDemoGitSummary(): GitSummary {
  return {
    initialized: true,
    shallow: false,
    commits: [
      {
        sha: "8a7c3d1e9f0a1b2c",
        subject: "Init HR Domain",
        committedAt: "2026-04-26T10:00:00.000Z",
      },
      {
        sha: "e9b3c42a1f2d3e4f",
        subject: "Payroll Integration",
        committedAt: "2026-05-06T14:32:00.000Z",
      },
      {
        sha: "f1a2b3c4d5e6f7a8",
        subject: "Auth Hardening",
        committedAt: "2026-05-12T09:15:00.000Z",
      },
      {
        sha: "a4b5c6d7e8f9a0b1",
        subject: "Worker Queue",
        committedAt: "2026-05-18T16:00:00.000Z",
      },
      {
        sha: "b7c8d9e0f1a2b3c4",
        subject: "Leave Request Trace",
        committedAt: "2026-05-22T11:45:00.000Z",
      },
    ],
    branches: [{ name: "main", headSha: "b7c8d9e0f1a2b3c4" }],
    workingTree: {
      modified: [
        "src/auth.ts",
        "src/payroll/service.ts",
        "src/leave/controller.ts",
        "src/leave/repository.ts",
        "package.json",
        "package-lock.json",
        "src/workers/notification.ts",
      ],
      added: [
        "src/payroll/service.ts",
        "src/payroll/batch.ts",
        "src/leave/dto.ts",
        "src/workers/payroll-job.ts",
      ],
      deleted: ["src/legacy/timesheet.ts"],
    },
  };
}
