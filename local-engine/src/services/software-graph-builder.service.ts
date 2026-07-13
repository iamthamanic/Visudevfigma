/**
 * Builds a neutral SoftwareGraph from a RawBlueprintScan.
 * Location: local-engine/src/services/software-graph-builder.service.ts
 *
 * Design decisions:
 * - Keep the public API small: one function, one input, one output.
 * - Internally split responsibilities into small, testable modules under
 *   software-graph/ so each file has a single reason to change.
 * - Scopes and IDs are tracked in Maps/Sets for O(1) lookups.
 * - Soft limits are checked while building, not after, so condensation does
 *   not leave dangling edges or groups.
 * - Evidence stores sanitized excerpts, never raw source lines or secrets.
 */

import type {
  RawBlueprintFact,
  RawBlueprintRoute,
  RawBlueprintScan,
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphEvidence,
  SoftwareGraphGroup,
  SoftwareGraphNode,
  SoftwareGraphScope,
} from "../types/api.types.js";
import { classifyFactKind } from "./software-graph/_classification.js";
import {
  detectDomain,
  detectLayer,
  detectModule,
  inferRuntime,
  normalizePath,
} from "./software-graph/_heuristics.js";
import { createId, uniqueId } from "./software-graph/_ids.js";
import { sanitizeExcerpt, sanitizeMetadata } from "./software-graph/_sanitize.js";
import {
  createApplicationScope,
  createDomainScope,
  createFileScope,
  createModuleScope,
  createOrganizationScope,
} from "./software-graph/_scopes.js";
import type { IdRegistry } from "./software-graph/_types.js";
import { normalizeFact, normalizeRoute, validateScan } from "./software-graph/_validation.js";

const DEFAULT_LIMITS = { maxNodes: 2500, maxEdges: 5000 };

interface FileContext {
  domainId: string;
  moduleId: string;
  fileId: string;
}

interface GraphBuilderState {
  scopes: Map<string, SoftwareGraphScope>;
  nodes: Map<string, SoftwareGraphNode>;
  edges: Map<string, SoftwareGraphEdge>;
  evidence: SoftwareGraphEvidence[];
  registry: IdRegistry;
  nodeCount: number;
  edgeCount: number;
  attemptedNodes: number;
  attemptedEdges: number;
  condensed: boolean;
}

function createBuilderState(): GraphBuilderState {
  return {
    scopes: new Map(),
    nodes: new Map(),
    edges: new Map(),
    evidence: [],
    registry: { nodes: new Set(), edges: new Set(), scopes: new Set() },
    nodeCount: 0,
    edgeCount: 0,
    attemptedNodes: 0,
    attemptedEdges: 0,
    condensed: false,
  };
}

function canAddNode(state: GraphBuilderState): boolean {
  if (state.condensed) return false;
  if (state.attemptedNodes >= DEFAULT_LIMITS.maxNodes) {
    state.condensed = true;
    return false;
  }
  return true;
}

function canAddEdge(state: GraphBuilderState): boolean {
  if (state.condensed) return false;
  if (state.attemptedEdges >= DEFAULT_LIMITS.maxEdges) {
    state.condensed = true;
    return false;
  }
  return true;
}

function addNode(state: GraphBuilderState, node: SoftwareGraphNode): void {
  state.attemptedNodes += 1;
  if (!canAddNode(state)) return;
  state.nodes.set(node.id, node);
  state.nodeCount += 1;
}

function addEdge(state: GraphBuilderState, edge: SoftwareGraphEdge): void {
  state.attemptedEdges += 1;
  if (!canAddEdge(state)) return;
  state.edges.set(edge.id, edge);
  state.edgeCount += 1;
}

function addScope(state: GraphBuilderState, scope: SoftwareGraphScope): void {
  if (!state.scopes.has(scope.id)) {
    state.scopes.set(scope.id, scope);
  }
}

function ensureFileContext(
  filePath: string,
  projectId: string,
  state: GraphBuilderState,
): FileContext {
  const domain = detectDomain(filePath);
  const moduleName = detectModule(filePath, domain);
  const domainId = uniqueId(state.registry, "scope", `domain:${domain}`);
  const moduleId = uniqueId(state.registry, "scope", `module:${domain}:${moduleName}`);
  const fileId = uniqueId(state.registry, "scope", `file:${normalizePath(filePath)}`);

  if (!state.scopes.has(domainId)) {
    addScope(state, createDomainScope(domain, projectId));
    addNode(state, {
      id: domainId,
      kind: "domain",
      label: domain,
      scopeId: `app:${projectId}`,
      metadata: {},
    });
    addEdge(state, {
      id: uniqueId(state.registry, "edge", createId("edge", "app", domainId)),
      kind: "contains",
      sourceId: `app:${projectId}`,
      targetId: domainId,
      metadata: {},
    });
  }

  if (!state.scopes.has(moduleId)) {
    addScope(state, createModuleScope(moduleName, domain));
    addNode(state, {
      id: moduleId,
      kind: "module",
      label: moduleName,
      scopeId: domainId,
      metadata: { layer: detectLayer(filePath) },
    });
    addEdge(state, {
      id: uniqueId(state.registry, "edge", createId("edge", domainId, moduleId)),
      kind: "contains",
      sourceId: domainId,
      targetId: moduleId,
      metadata: {},
    });
  }

  if (!state.scopes.has(fileId)) {
    addScope(state, createFileScope(filePath, moduleId));
    addNode(state, {
      id: fileId,
      kind: "file",
      label: filePath.split("/").pop() || filePath,
      scopeId: moduleId,
      filePath,
      metadata: { runtime: inferRuntime(filePath) },
    });
    addEdge(state, {
      id: uniqueId(state.registry, "edge", createId("edge", moduleId, fileId)),
      kind: "contains",
      sourceId: moduleId,
      targetId: fileId,
      metadata: {},
    });
  }

  return { domainId, moduleId, fileId };
}

function addRouteNodes(
  route: RawBlueprintRoute,
  fileId: string,
  moduleId: string,
  state: GraphBuilderState,
): void {
  const routeNodeId = uniqueId(state.registry, "node", `route:${route.id}`);

  addNode(state, {
    id: routeNodeId,
    kind: "route",
    label: `${route.method} ${route.path}`,
    scopeId: fileId,
    filePath: route.filePath,
    line: route.line,
    metadata: {
      method: route.method,
      path: route.path,
      pipelineCount: route.pipeline?.length ?? 0,
    },
  });

  addEdge(state, {
    id: uniqueId(state.registry, "edge", createId("edge", fileId, routeNodeId)),
    kind: "contains",
    sourceId: fileId,
    targetId: routeNodeId,
    metadata: {},
  });
  addEdge(state, {
    id: uniqueId(state.registry, "edge", createId("edge", moduleId, routeNodeId, "references")),
    kind: "references",
    sourceId: moduleId,
    targetId: routeNodeId,
    metadata: {},
  });
}

function addFactEvidence(fact: RawBlueprintFact, fileId: string, state: GraphBuilderState): void {
  const evId = uniqueId(state.registry, "node", createId("ev", fact.id));
  state.evidence.push({
    id: evId,
    factId: fact.id,
    kind: fact.kind,
    filePath: fact.filePath,
    line: fact.line,
    excerpt: sanitizeExcerpt(fact.snippet),
  });

  const classification = classifyFactKind(fact.kind);
  if (!classification.nodeKind) return;

  const inferredNodeId = uniqueId(state.registry, "node", createId("inferred", fact.kind, fact.id));
  addNode(state, {
    id: inferredNodeId,
    kind: classification.nodeKind,
    label: fact.kind,
    scopeId: fileId,
    filePath: fact.filePath,
    line: fact.line,
    metadata: sanitizeMetadata(fact.metadata ?? {}),
  });

  addEdge(state, {
    id: uniqueId(state.registry, "edge", createId("edge", fileId, inferredNodeId)),
    kind: "contains",
    sourceId: fileId,
    targetId: inferredNodeId,
    metadata: {},
  });

  if (classification.edgeKind) {
    addEdge(state, {
      id: uniqueId(
        state.registry,
        "edge",
        createId("edge", fileId, inferredNodeId, classification.edgeKind),
      ),
      kind: classification.edgeKind,
      sourceId: fileId,
      targetId: inferredNodeId,
      metadata: { evidenceFactId: fact.id },
    });
  }
}

function buildRuntimeGroups(nodes: SoftwareGraphNode[]): SoftwareGraphGroup[] {
  const groups = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.kind === "file" && node.metadata.runtime) {
      const runtime = node.metadata.runtime as string;
      const list = groups.get(runtime) ?? [];
      list.push(node.id);
      groups.set(runtime, list);
    }
  }
  return [...groups.entries()].map(([runtime, nodeIds]) => ({
    id: `group:runtime:${runtime}`,
    kind: "file" as const,
    label: runtime,
    nodeIds,
  }));
}

function dropDanglingEdges(edges: SoftwareGraphEdge[], nodeIds: Set<string>): SoftwareGraphEdge[] {
  return edges.filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId));
}

export function buildSoftwareGraph(scan: RawBlueprintScan): SoftwareGraph {
  const validationError = validateScan(scan);
  if (validationError) {
    throw new Error(`Invalid RawBlueprintScan: ${validationError}`);
  }

  const projectId = scan.projectId;
  const projectAppScope = createApplicationScope(projectId);
  const projectOrgScope = createOrganizationScope(projectId);

  const state = createBuilderState();
  addScope(state, projectOrgScope);
  addScope(state, projectAppScope);
  addNode(state, { id: projectOrgScope.id, kind: "organization", label: projectId, metadata: {} });
  addNode(state, {
    id: projectAppScope.id,
    kind: "application",
    label: projectId,
    scopeId: projectOrgScope.id,
    metadata: {},
  });
  addEdge(state, {
    id: createId("edge", projectOrgScope.id, projectAppScope.id),
    kind: "contains",
    sourceId: projectOrgScope.id,
    targetId: projectAppScope.id,
    metadata: {},
  });

  const routes = scan.routes
    .map(normalizeRoute)
    .filter((route): route is RawBlueprintRoute => route !== null);
  const facts = scan.facts
    .map(normalizeFact)
    .filter((fact): fact is RawBlueprintFact => fact !== null);

  for (const route of routes) {
    const { fileId, moduleId } = ensureFileContext(route.filePath, projectId, state);
    addRouteNodes(route, fileId, moduleId, state);
  }

  for (const fact of facts) {
    const { fileId } = ensureFileContext(fact.filePath, projectId, state);
    addFactEvidence(fact, fileId, state);
  }

  const runtimeNodeId = uniqueId(state.registry, "node", `runtime:${projectId}`);
  const runtimes = [
    ...new Set(
      [...state.nodes.values()]
        .filter((n) => n.kind === "file")
        .map((n) => n.metadata.runtime as string)
        .filter(Boolean),
    ),
  ];
  addNode(state, {
    id: runtimeNodeId,
    kind: "runtime",
    label: "runtime",
    scopeId: projectAppScope.id,
    metadata: { runtimes },
  });
  addEdge(state, {
    id: uniqueId(state.registry, "edge", createId("edge", projectAppScope.id, runtimeNodeId)),
    kind: "contains",
    sourceId: projectAppScope.id,
    targetId: runtimeNodeId,
    metadata: {},
  });

  const nodeArray = [...state.nodes.values()];
  const nodeIds = new Set(state.nodes.keys());
  const edgeArray = dropDanglingEdges([...state.edges.values()], nodeIds);
  const groups = buildRuntimeGroups(nodeArray);

  return {
    version: 1,
    projectId,
    analyzedAt: scan.analyzedAt,
    scopes: [...state.scopes.values()],
    nodes: nodeArray,
    edges: edgeArray,
    evidence: state.evidence,
    groups,
    metrics: [
      { id: "metric:files", name: "filesAnalyzed", value: scan.filesAnalyzed },
      { id: "metric:routes", name: "routesDetected", value: routes.length },
      { id: "metric:facts", name: "factsDetected", value: facts.length },
      { id: "metric:nodes", name: "nodeCount", value: state.attemptedNodes },
      { id: "metric:edges", name: "edgeCount", value: state.attemptedEdges },
    ],
    condensed: state.condensed,
    limits: { ...DEFAULT_LIMITS },
  };
}
