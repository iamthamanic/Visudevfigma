/** Evidence index + linking for VisuDevGraph fact mapping. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { VisuDevEvidence } from "../../dto/graph/visudev-graph.dto.ts";
import { sanitizeSnippetForExport } from "../internal/snippet-sanitizer.ts";
import { validateCodeFactShape } from "./fact-graph.validate.ts";

export interface EvidenceIndex {
  list: VisuDevEvidence[];
  byId: Map<string, VisuDevEvidence>;
  idForFact: (fact: CodeFact) => string;
}

interface EvidenceFactSource {
  key: unknown;
  id: string;
  kind: string;
  filePath: string;
  line: number;
  snippet: string;
}

function normalizeFactForEvidence(
  raw: unknown,
  index: number,
): EvidenceFactSource {
  if (validateCodeFactShape(raw as CodeFact)) {
    const fact = raw as CodeFact;
    return {
      key: fact,
      id: fact.id,
      kind: fact.kind,
      filePath: fact.filePath,
      line: fact.line,
      snippet: fact.snippet,
    };
  }

  const candidate = raw && typeof raw === "object"
    ? raw as Partial<CodeFact>
    : undefined;
  const id = typeof candidate?.id === "string" && candidate.id.trim().length > 0
    ? candidate.id.trim()
    : `malformed-fact-${index + 1}`;
  const kind =
    typeof candidate?.kind === "string" && candidate.kind.trim().length > 0
      ? candidate.kind.trim()
      : "unknown";
  const filePath = typeof candidate?.filePath === "string" &&
      candidate.filePath.trim().length > 0
    ? candidate.filePath.trim()
    : "unknown";
  const line = Number.isFinite(candidate?.line) && (candidate?.line ?? 0) >= 1
    ? Math.floor(candidate!.line!)
    : 1;
  const snippet = typeof candidate?.snippet === "string"
    ? candidate.snippet
    : "";

  return { key: raw, id, kind, filePath, line, snippet };
}

export function buildEvidenceIndex(facts: unknown[]): EvidenceIndex {
  const list: VisuDevEvidence[] = [];
  const byId = new Map<string, VisuDevEvidence>();
  const idForFact = new Map<unknown, string>();
  const duplicateSuffix = new Map<string, number>();
  const inputFacts = Array.isArray(facts) ? facts : [];

  for (let index = 0; index < inputFacts.length; index++) {
    const source = normalizeFactForEvidence(inputFacts[index], index);
    const id = nextEvidenceId(source.id, byId, duplicateSuffix);
    const item: VisuDevEvidence = {
      id,
      factId: source.id,
      subjectType: "node",
      subjectId: "",
      filePath: source.filePath,
      line: source.line,
      snippet: sanitizeSnippetForExport(source.snippet),
      summary: `Code fact: ${source.kind}`,
    };
    list.push(item);
    byId.set(id, item);
    idForFact.set(source.key, id);
  }

  return {
    list,
    byId,
    idForFact(fact: CodeFact): string {
      const evidenceId = idForFact.get(fact);
      if (!evidenceId) {
        throw new Error(`VisuDevGraph evidence missing for fact ${fact.id}`);
      }
      return evidenceId;
    },
  };
}

export function linkEvidence(
  index: EvidenceIndex,
  evidenceId: string,
  subjectType: VisuDevEvidence["subjectType"],
  subjectId: string,
): void {
  const item = index.byId.get(evidenceId);
  if (!item) {
    throw new Error(`VisuDevGraph evidence missing for id ${evidenceId}`);
  }
  item.subjectType = subjectType;
  item.subjectId = subjectId;
}

export function finalizeOrphanEvidence(index: EvidenceIndex): void {
  for (const item of index.list) {
    if (item.subjectId.length > 0) continue;
    item.subjectType = "scope";
    item.subjectId = `unmapped:${item.filePath}:${item.line}`;
  }
}

export function evidenceIdForFact(factId: string): string {
  return `evidence-${factId}`;
}

function nextEvidenceId(
  factId: string,
  byId: Map<string, VisuDevEvidence>,
  duplicateSuffix: Map<string, number>,
): string {
  const base = evidenceIdForFact(factId);
  if (!byId.has(base)) return base;
  const suffix = duplicateSuffix.get(factId) ?? 2;
  duplicateSuffix.set(factId, suffix + 1);
  return `${base}~${suffix}`;
}
