/**
 * HR-tool demo SoftwareGraph fixture (browo/hr-tool Zielbild baseline).
 * Location: shared/demo-graph-seed.ts
 */

import type { SoftwareGraph } from "./software-graph.types.js";

const LAYER_LABELS = [
  "Experience Layer",
  "Application Layer",
  "Domain Layer",
  "Integration Layer",
  "Persistence Layer",
  "Processing Layer",
  "Platform Layer",
] as const;

const DOMAIN_MODULES = [
  "People",
  "Time",
  "Leave",
  "Documents",
  "Payroll",
  "Workflows",
  "Analytics",
] as const;

function node(
  id: string,
  kind: SoftwareGraph["nodes"][0]["kind"],
  label: string,
  extra: Partial<SoftwareGraph["nodes"][0]> = {},
) {
  return { id, kind, label, metadata: {}, ...extra };
}

function edge(
  id: string,
  kind: SoftwareGraph["edges"][0]["kind"],
  sourceId: string,
  targetId: string,
) {
  return { id, kind, sourceId, targetId, metadata: {} };
}

/**
 * Builds a sagadrive-friendly HR-tool reference graph (matches Zielbild fixtures).
 */
export function buildHrToolDemoGraph(projectId: string): SoftwareGraph {
  const analyzedAt = new Date().toISOString();
  const nodes = [
    node("org:hr", "organization", projectId),
    node("app:hr", "application", "hr-tool", { scopeId: "org:hr" }),
    ...LAYER_LABELS.map((label, index) =>
      node(`layer:${index}`, "layer", label, { scopeId: "app:hr" }),
    ),
    ...DOMAIN_MODULES.map((label, index) =>
      node(`domain:${index}`, "domain", label, { scopeId: "layer:2" }),
    ),
    node("module:leave-uc", "module", "CreateLeaveRequest", {
      filePath: "src/application/create-leave-request.ts",
    }),
    node("module:leave-repo", "module", "LeaveRepository", {
      filePath: "src/domain/leave-repository.ts",
      metadata: { durationMs: 55 },
    }),
    node("route:leave", "route", "POST /api/leave-requests", {
      filePath: "src/routes/leave.ts",
      line: 12,
      metadata: {
        routeId: "leave",
        executionStatus: "running",
        traceId: "tr-7f3a2b1c",
        durationMs: 35,
      },
    }),
    node("file:form", "file", "LeaveRequestForm", {
      filePath: "src/ui/LeaveRequestForm.tsx",
      metadata: { runtime: "browser", type: "Use Case" },
    }),
    node("file:uc", "file", "CreateLeaveRequest", {
      filePath: "src/application/create-leave-request.ts",
      metadata: { runtime: "server", type: "Use Case", durationMs: 68 },
    }),
    node("file:controller", "file", "LeaveController", {
      filePath: "src/api/leave-controller.ts",
      metadata: { type: "Controller", durationMs: 42 },
    }),
    node("service:auth", "service", "AuthService", {
      metadata: { type: "Service", durationMs: 31 },
    }),
    node("service:validation", "service", "ValidationService", {
      metadata: { type: "Service", durationMs: 24 },
    }),
    node("service:policy", "service", "LeavePolicy", {
      metadata: { type: "Policy", durationMs: 18 },
    }),
    node("service:email", "external", "EmailService", { metadata: { type: "Externer Service" } }),
    node("service:worker", "service", "NotificationWorker", {
      metadata: { type: "Worker", durationMs: 22 },
    }),
    node("service:web", "service", "Web App", {
      metadata: { framework: "Next.js 14", port: 3000, tier: "web" },
    }),
    node("service:api", "service", "API Service", {
      metadata: { framework: "Node.js 20", port: 4000, tier: "api" },
    }),
    node("service:worker-infra", "service", "Worker", {
      metadata: { framework: "BullMQ", port: 4001, tier: "worker" },
    }),
    node("service:auth-infra", "service", "Auth Service", {
      metadata: { framework: "Node.js 20", port: 4002, tier: "auth" },
    }),
    node("runtime:lb", "runtime", "LOAD BALANCER / GATEWAY", {
      metadata: { technology: "NGINX" },
    }),
    node("runtime:internet", "runtime", "Internet", { metadata: { tier: "edge" } }),
    node("table:pg", "table", "PostgreSQL", {
      metadata: { version: "15", port: 5432, durationMs: 89 },
    }),
    node("table:redis", "table", "Redis", { metadata: { version: "7", port: 6379 } }),
    node("table:storage", "table", "STORAGE", { metadata: { kind: "S3 Compatible" } }),
    node("external:stripe", "external", "Payment API (Stripe)", {}),
    node("external:sso", "external", "SSO (OIDC)", {}),
    node("external:monitor", "external", "Prometheus", { metadata: { tier: "monitoring" } }),
    node("runtime:main", "runtime", "runtime", { metadata: { runtimes: ["server", "browser"] } }),
  ];

  const edges = [
    edge("e-org-app", "contains", "org:hr", "app:hr"),
    ...LAYER_LABELS.map((_, index) =>
      edge(`e-app-layer-${index}`, "contains", "app:hr", `layer:${index}`),
    ),
    ...DOMAIN_MODULES.map((_, index) =>
      edge(`e-layer-domain-${index}`, "contains", "layer:2", `domain:${index}`),
    ),
    edge("e-domain-leave", "contains", "domain:2", "module:leave-uc"),
    edge("e-module-route", "contains", "module:leave-uc", "route:leave"),
    edge("e-form-uc", "calls", "file:form", "file:uc"),
    edge("e-uc-controller", "calls", "file:uc", "file:controller"),
    edge("e-uc-auth", "authenticates", "file:uc", "service:auth"),
    edge("e-uc-validation", "validates", "file:uc", "service:validation"),
    edge("e-uc-policy", "calls", "file:uc", "service:policy"),
    edge("e-uc-repo", "calls", "file:uc", "module:leave-repo"),
    edge("e-repo-pg", "data", "module:leave-repo", "table:pg"),
    edge("e-uc-email", "external-dependency", "file:uc", "service:email"),
    edge("e-uc-worker", "event", "file:uc", "service:worker"),
    edge("e-internet-lb", "api", "runtime:internet", "runtime:lb"),
    edge("e-lb-web", "api", "runtime:lb", "service:web"),
    edge("e-lb-api", "api", "runtime:lb", "service:api"),
    edge("e-api-pg", "data", "service:api", "table:pg"),
    edge("e-api-redis", "data", "service:api", "table:redis"),
    edge("e-api-storage", "data", "service:api", "table:storage"),
    edge("e-worker-redis", "data", "service:worker-infra", "table:redis"),
    edge("e-api-stripe", "external-dependency", "service:api", "external:stripe"),
    edge("e-auth-sso", "external-dependency", "service:auth-infra", "external:sso"),
    edge("e-api-monitor", "references", "service:api", "external:monitor"),
    edge("e-runtime-uc", "contains", "runtime:main", "file:uc"),
    edge("e-layer-web", "contains", "layer:0", "service:web"),
    edge("e-layer-api", "contains", "layer:1", "service:api"),
    edge("e-layer-pg", "contains", "layer:4", "table:pg"),
  ];

  return {
    version: 1,
    projectId,
    analyzedAt,
    scopes: [
      { level: "organization", id: "org:hr", label: projectId },
      { level: "application", id: "app:hr", label: "hr-tool", parentId: "org:hr" },
    ],
    nodes,
    edges,
    evidence: [
      {
        id: "ev-payload",
        factId: "fact-payload",
        kind: "payload",
        filePath: "src/ui/LeaveRequestForm.tsx",
        line: 87,
        excerpt: '{"employeeId":"usr_67890","type":"ANNUAL","startDate":"2026-08-01"}',
        nodeId: "file:uc",
      },
    ],
    groups: [
      {
        id: "g-atlas-web",
        kind: "service",
        label: "WEB APP",
        nodeIds: ["service:web", "file:form"],
      },
      {
        id: "g-atlas-api",
        kind: "service",
        label: "API SERVICE",
        nodeIds: ["service:api", "file:uc", "file:controller"],
      },
      {
        id: "execution:leave:0",
        kind: "route",
        label: "LeaveRequest · Echtzeit-Trace",
        nodeIds: [
          "route:leave",
          "file:controller",
          "file:uc",
          "service:auth",
          "service:validation",
          "module:leave-repo",
          "table:pg",
          "service:worker",
        ],
      },
    ],
    metrics: [
      { id: "m-modules", name: "modules", value: 1248 },
      { id: "m-files", name: "files", value: 5732 },
    ],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
    snapshots: [
      {
        id: "snap-1",
        label: "Init HR Domain",
        ref: "8a7c3d1",
        capturedAt: "2026-04-26T10:00:00.000Z",
        nodeIds: ["domain:0", "domain:2", "module:leave-uc"],
        commitSha: "8a7c3d1",
      },
      {
        id: "snap-2",
        label: "Payroll Integration",
        ref: "e9b3c42",
        capturedAt: "2026-05-06T14:32:00.000Z",
        nodeIds: ["domain:4", "module:leave-uc", "service:api", "table:pg"],
        commitSha: "e9b3c42",
      },
      {
        id: "snap-3",
        label: "Auth Hardening",
        ref: "f1a2b3c",
        capturedAt: "2026-05-12T09:15:00.000Z",
        nodeIds: ["service:auth", "service:auth-infra", "file:uc"],
        commitSha: "f1a2b3c",
      },
      {
        id: "snap-4",
        label: "Worker Queue",
        ref: "a4b5c6d",
        capturedAt: "2026-05-18T16:00:00.000Z",
        nodeIds: ["service:worker", "service:worker-infra", "table:redis"],
        commitSha: "a4b5c6d",
      },
      {
        id: "snap-5",
        label: "Monitoring Stack",
        ref: "c7d8e9f",
        capturedAt: "2026-05-24T11:00:00.000Z",
        nodeIds: ["external:monitor", "service:api", "runtime:lb"],
        commitSha: "c7d8e9f",
      },
    ],
  };
}
