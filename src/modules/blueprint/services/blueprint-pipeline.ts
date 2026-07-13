/**
 * Build a fixed linear pipeline for the Route Blueprint Canvas.
 * Location: src/modules/blueprint/services/blueprint-pipeline.ts
 *
 * Normalizes the variable backend pipeline into the documented concept order:
 * Request → Auth Gate → Role Gate → Validation Gate → Handler → Database → Audit → External.
 * Missing gates become dashed placeholder nodes so gaps are visible.
 */

import type { ConceptState, PipelineNode, RouteBlueprint } from "../types";

type SlotType =
  | "request"
  | "auth-gate"
  | "role-gate"
  | "validation-gate"
  | "handler"
  | "db-write"
  | "audit-log"
  | "external-api";

interface SlotConfig {
  type: SlotType;
  label: string;
  category: "core-gate" | "data-flow" | "framework" | "normal";
  /** If true, an unknown/missing state is shown as a red dashed gap. */
  required: boolean;
}

const PIPELINE_SLOTS: SlotConfig[] = [
  { type: "request", label: "Request", category: "normal", required: false },
  { type: "auth-gate", label: "Auth Gate", category: "core-gate", required: true },
  { type: "role-gate", label: "Role Gate", category: "core-gate", required: true },
  { type: "validation-gate", label: "Validation Gate", category: "core-gate", required: true },
  { type: "handler", label: "Handler", category: "normal", required: false },
  { type: "db-write", label: "Database", category: "data-flow", required: false },
  { type: "audit-log", label: "Audit", category: "core-gate", required: false },
  { type: "external-api", label: "External", category: "framework", required: false },
];

const DEFAULT_STATE: Record<SlotType, ConceptState> = {
  request: "confirmed",
  "auth-gate": "missing",
  "role-gate": "missing",
  "validation-gate": "missing",
  handler: "confirmed",
  "db-write": "unknown",
  "audit-log": "unknown",
  "external-api": "unknown",
};

export function buildLinearPipeline(route: RouteBlueprint): PipelineNode[] {
  const nodeByType = new Map<string, PipelineNode>();
  for (const node of route.pipeline) {
    if (!nodeByType.has(node.type)) {
      nodeByType.set(node.type, node);
    }
  }

  // The backend sometimes emits db-read nodes; map them to the Database slot.
  const dbNode = nodeByType.get("db-write") ?? nodeByType.get("db-read");

  return PIPELINE_SLOTS.map((slot) => {
    const existing = slot.type === "db-write" ? dbNode : nodeByType.get(slot.type);
    if (existing) {
      return existing;
    }

    const conceptState = route.concepts[slot.type];
    const state = conceptState ?? DEFAULT_STATE[slot.type];
    return {
      id: `${route.id}:${slot.type}:placeholder`,
      type: slot.type,
      label: slot.label,
      state,
    };
  });
}

export function slotCategory(type: string): SlotConfig["category"] {
  return PIPELINE_SLOTS.find((s) => s.type === type)?.category ?? "normal";
}

export function isCoreGate(type: string): boolean {
  return PIPELINE_SLOTS.some((s) => s.type === type && s.required);
}
