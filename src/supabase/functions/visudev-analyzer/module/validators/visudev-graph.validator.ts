/** Runtime Zod validation for VisuDevGraph export payloads. */

import { z } from "zod";
import type {
  VisuDevEdge,
  VisuDevEvidence,
  VisuDevFinding,
  VisuDevGraph,
  VisuDevNode,
  VisuDevScope,
} from "../dto/graph/visudev-graph.dto.ts";
import { repairGraphReferences } from "../blueprint/internal/graph-export-integrity.ts";

const detectionStateSchema = z.enum(["confirmed", "missing", "unknown"]);

const exportMetadataSchema = z.record(
  z.union([z.string(), z.number(), z.boolean()]),
).optional();

const visuDevEvidenceSchema = z.object({
  id: z.string().trim().min(1).max(80),
  factId: z.string().trim().min(1).max(120),
  subjectType: z.enum(["node", "edge", "scope"]),
  subjectId: z.string().max(120),
  filePath: z.string().trim().min(1).max(260),
  line: z.number().int().positive(),
  snippet: z.string().max(121),
  summary: z.string().max(120),
});

const visuDevNodeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  kind: z.enum([
    "route",
    "auth",
    "validation",
    "rate-limit",
    "table",
    "external_api",
  ]),
  label: z.string().max(120),
  state: detectionStateSchema,
  scopeId: z.string().max(120).optional(),
  filePath: z.string().max(260).optional(),
  line: z.number().int().positive().optional(),
  metadata: exportMetadataSchema,
  evidenceIds: z.array(z.string().max(80)),
});

const visuDevEdgeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  fromNodeId: z.string().trim().min(1).max(80),
  toNodeId: z.string().trim().min(1).max(80),
  kind: z.enum([
    "reads",
    "writes",
    "validates",
    "authenticates",
    "calls",
    "rate_limits",
  ]),
  state: detectionStateSchema,
  scopeId: z.string().max(120).optional(),
  evidenceIds: z.array(z.string().max(80)),
  metadata: exportMetadataSchema,
});

const visuDevScopeSchema = z.object({
  id: z.string().trim().min(1).max(120),
  kind: z.literal("route"),
  label: z.string().max(120),
  nodeIds: z.array(z.string().max(80)),
  edgeIds: z.array(z.string().max(80)),
  metadata: exportMetadataSchema,
});

const visuDevFindingSchema = z.object({
  id: z.string().trim().min(1).max(80),
  ruleId: z.string().trim().min(1).max(120),
  scopeId: z.string().trim().min(1).max(120),
  controlKind: z.enum(["auth", "validation", "rate-limit", "db-write"]),
  expectedControlNodeId: z.string().max(80).optional(),
  outcome: z.enum(["missing", "not_applicable"]),
  message: z.string().max(240),
  expectedState: z.string().max(120),
  actualState: z.string().max(120),
  evidenceIds: z.array(z.string().max(80)),
  severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
});

const visuDevGraphSchema = z.object({
  version: z.literal(1),
  nodes: z.array(visuDevNodeSchema),
  edges: z.array(visuDevEdgeSchema),
  evidence: z.array(visuDevEvidenceSchema),
  scopes: z.array(visuDevScopeSchema),
  findings: z.array(visuDevFindingSchema),
});

const visuDevEvidenceLooseSchema = z.object({
  id: z.string().trim().min(1),
  factId: z.string().trim().min(1),
  subjectType: z.enum(["node", "edge", "scope"]),
  subjectId: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  line: z.coerce.number().int().positive(),
  snippet: z.string(),
  summary: z.string(),
});

const visuDevNodeLooseSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum([
    "route",
    "auth",
    "validation",
    "rate-limit",
    "table",
    "external_api",
  ]),
  label: z.string(),
  state: detectionStateSchema,
  scopeId: z.string().optional(),
  filePath: z.string().optional(),
  line: z.coerce.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
  evidenceIds: z.array(z.string()).optional(),
});

const visuDevEdgeLooseSchema = z.object({
  id: z.string().trim().min(1),
  fromNodeId: z.string().trim().min(1),
  toNodeId: z.string().trim().min(1),
  kind: z.enum([
    "reads",
    "writes",
    "validates",
    "authenticates",
    "calls",
    "rate_limits",
  ]),
  state: detectionStateSchema,
  scopeId: z.string().optional(),
  evidenceIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const visuDevScopeLooseSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.literal("route"),
  label: z.string(),
  nodeIds: z.array(z.string()).optional(),
  edgeIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const visuDevGraphRootSchema = z.object({
  version: z.literal(1),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
  evidence: z.array(z.unknown()).optional(),
  scopes: z.array(z.unknown()).optional(),
  findings: z.array(z.unknown()).optional(),
});

export { visuDevGraphSchema };

export const EMPTY_VISU_DEV_GRAPH: VisuDevGraph = {
  version: 1,
  nodes: [],
  edges: [],
  evidence: [],
  scopes: [],
  findings: [],
};

function logCoercionDrop(section: string, dropped: number): void {
  if (dropped > 0) {
    console.warn(
      `[visudev-graph] coerceVisuDevGraphInput: dropped ${dropped} invalid ${section} entr${
        dropped === 1 ? "y" : "ies"
      }`,
    );
  }
}

function coerceNodes(items: unknown[] | undefined): VisuDevNode[] {
  if (!Array.isArray(items)) return [];
  const nodes: VisuDevNode[] = [];
  let dropped = 0;
  for (const nodeCandidate of items) {
    const parsed = visuDevNodeLooseSchema.safeParse(nodeCandidate);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    nodes.push({ ...parsed.data, evidenceIds: parsed.data.evidenceIds ?? [] });
  }
  logCoercionDrop("node", dropped);
  return nodes;
}

function coerceEdges(items: unknown[] | undefined): VisuDevEdge[] {
  if (!Array.isArray(items)) return [];
  const edges: VisuDevEdge[] = [];
  let dropped = 0;
  for (const edgeCandidate of items) {
    const parsed = visuDevEdgeLooseSchema.safeParse(edgeCandidate);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    edges.push({ ...parsed.data, evidenceIds: parsed.data.evidenceIds ?? [] });
  }
  logCoercionDrop("edge", dropped);
  return edges;
}

function coerceEvidence(items: unknown[] | undefined): VisuDevEvidence[] {
  if (!Array.isArray(items)) return [];
  const evidence: VisuDevEvidence[] = [];
  let repaired = 0;
  for (let index = 0; index < items.length; index++) {
    const evidenceCandidate = items[index];
    const parsed = visuDevEvidenceLooseSchema.safeParse(evidenceCandidate);
    if (parsed.success) {
      evidence.push(parsed.data);
      continue;
    }
    repaired += 1;
    evidence.push({
      id: `evidence-fallback-${index + 1}`,
      factId: `fact-fallback-${index + 1}`,
      subjectType: "scope",
      subjectId: `orphan:fallback-${index + 1}`,
      filePath: "unknown",
      line: 1,
      snippet: "",
      summary: "Code fact: unknown",
    });
  }
  if (repaired > 0) {
    console.warn(
      `[visudev-graph] coerceVisuDevGraphInput: repaired ${repaired} invalid evidence entr${
        repaired === 1 ? "y" : "ies"
      } with fallback placeholders`,
    );
  }
  return evidence;
}

function coerceScopes(items: unknown[] | undefined): VisuDevScope[] {
  if (!Array.isArray(items)) return [];
  const scopes: VisuDevScope[] = [];
  let dropped = 0;
  for (const scopeCandidate of items) {
    const parsed = visuDevScopeLooseSchema.safeParse(scopeCandidate);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    scopes.push({
      ...parsed.data,
      nodeIds: parsed.data.nodeIds ?? [],
      edgeIds: parsed.data.edgeIds ?? [],
    });
  }
  logCoercionDrop("scope", dropped);
  return scopes;
}

const visuDevFindingLooseSchema = z.object({
  id: z.string().trim().min(1),
  ruleId: z.string().trim().min(1),
  scopeId: z.string().trim().min(1),
  controlKind: z.enum(["auth", "validation", "rate-limit", "db-write"]),
  expectedControlNodeId: z.string().optional(),
  outcome: z.enum(["missing", "not_applicable"]),
  message: z.string(),
  expectedState: z.string(),
  actualState: z.string(),
  evidenceIds: z.array(z.string()).optional(),
  severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
});

function coerceFindings(items: unknown[] | undefined): VisuDevFinding[] {
  if (!Array.isArray(items)) return [];
  const findings: VisuDevFinding[] = [];
  let dropped = 0;
  for (const findingCandidate of items) {
    const parsed = visuDevFindingLooseSchema.safeParse(findingCandidate);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    findings.push({
      ...parsed.data,
      evidenceIds: parsed.data.evidenceIds ?? [],
    });
  }
  logCoercionDrop("finding", dropped);
  return findings;
}

export function coerceVisuDevGraphInput(input: unknown): VisuDevGraph {
  const parsed = visuDevGraphRootSchema.safeParse(input);
  if (!parsed.success) return { ...EMPTY_VISU_DEV_GRAPH };

  return {
    version: 1,
    nodes: coerceNodes(parsed.data.nodes),
    edges: coerceEdges(parsed.data.edges),
    evidence: coerceEvidence(parsed.data.evidence),
    scopes: coerceScopes(parsed.data.scopes),
    findings: coerceFindings(parsed.data.findings),
  };
}

function pruneGraphForExport(graph: VisuDevGraph): VisuDevGraph {
  const nodes = graph.nodes.flatMap((node) => {
    const parsed = visuDevNodeSchema.safeParse(node);
    return parsed.success ? [parsed.data] : [];
  });
  const edges = graph.edges.flatMap((edge) => {
    const parsed = visuDevEdgeSchema.safeParse(edge);
    return parsed.success ? [parsed.data] : [];
  });
  const evidence = graph.evidence.flatMap((item) => {
    const parsed = visuDevEvidenceSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
  const scopes = graph.scopes.flatMap((scope) => {
    const parsed = visuDevScopeSchema.safeParse(scope);
    return parsed.success ? [parsed.data] : [];
  });
  const findings = graph.findings.flatMap((finding) => {
    const parsed = visuDevFindingSchema.safeParse(finding);
    return parsed.success ? [parsed.data] : [];
  });
  return repairGraphReferences({
    version: 1,
    nodes,
    edges,
    evidence,
    scopes,
    findings,
  });
}

export function validateVisuDevGraphForExport(
  graph: VisuDevGraph,
): VisuDevGraph {
  const parsed = visuDevGraphSchema.safeParse(graph);
  if (parsed.success) return parsed.data;
  const pruned = pruneGraphForExport(graph);
  const reparsed = visuDevGraphSchema.safeParse(pruned);
  if (reparsed.success) return reparsed.data;
  return { ...EMPTY_VISU_DEV_GRAPH };
}
