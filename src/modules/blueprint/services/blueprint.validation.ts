/**
 * Why: keep blueprint payload whitelist and shape rules apart from port CRUD.
 */
import type { BlueprintUpdateInput } from "../types";
import type { BlueprintServiceResult } from "./blueprint.port";

const MAX_JSON_CHARS = 100_000;
const MAX_COMPONENTS = 500;
const MAX_VIOLATIONS = 100;
const MAX_CYCLES = 50;
const SEVERITIES = new Set(["error", "warn", "info"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function measureJson(value: unknown): BlueprintServiceResult<number> {
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") {
      return { success: false, error: "Invalid blueprint payload" };
    }
    return { success: true, data: serialized.length };
  } catch {
    return { success: false, error: "Invalid blueprint payload" };
  }
}

function requireString(value: unknown, field: string, max: number): BlueprintServiceResult<string> {
  if (typeof value !== "string") return { success: false, error: `${field} must be a string` };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { success: false, error: `${field} must not be empty` };
  if (trimmed.length > max) return { success: false, error: `${field} too long` };
  return { success: true, data: trimmed };
}

function sanitizeComponents(value: unknown): BlueprintServiceResult<unknown[]> {
  if (!Array.isArray(value)) return { success: false, error: "components must be an array" };
  if (value.length > MAX_COMPONENTS) return { success: false, error: "Too many components" };
  const out: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) return { success: false, error: "Invalid component entry" };
    const name = requireString(item.name, "component.name", 200);
    if (!name.success || !name.data) return { success: false, error: name.error };
    const sanitized: Record<string, unknown> = { name: name.data };
    if (item.type !== undefined) {
      const type = requireString(item.type, "component.type", 100);
      if (!type.success || !type.data) return { success: false, error: type.error };
      sanitized.type = type.data;
    }
    if (item.path !== undefined) {
      const pathValue = requireString(item.path, "component.path", 500);
      if (!pathValue.success || !pathValue.data) return { success: false, error: pathValue.error };
      sanitized.path = pathValue.data;
    }
    out.push(sanitized);
  }
  return { success: true, data: out };
}

function sanitizeViolations(value: unknown): BlueprintServiceResult<unknown[]> {
  if (!Array.isArray(value)) return { success: false, error: "violations must be an array" };
  if (value.length > MAX_VIOLATIONS) return { success: false, error: "Too many violations" };
  const out: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) return { success: false, error: "Invalid violation entry" };
    const ruleId = requireString(item.ruleId, "violation.ruleId", 100);
    if (!ruleId.success || !ruleId.data) return { success: false, error: ruleId.error };
    if (typeof item.severity !== "string" || !SEVERITIES.has(item.severity)) {
      return { success: false, error: "Invalid violation.severity" };
    }
    const source = requireString(item.source, "violation.source", 500);
    if (!source.success || !source.data) return { success: false, error: source.error };
    const message = requireString(item.message, "violation.message", 1000);
    if (!message.success || !message.data) return { success: false, error: message.error };
    const sanitized: Record<string, unknown> = {
      ruleId: ruleId.data,
      severity: item.severity,
      source: source.data,
      message: message.data,
    };
    if (item.target !== undefined) {
      const target = requireString(item.target, "violation.target", 500);
      if (!target.success || !target.data) return { success: false, error: target.error };
      sanitized.target = target.data;
    }
    out.push(sanitized);
  }
  return { success: true, data: out };
}

function sanitizeCycles(value: unknown): BlueprintServiceResult<unknown[]> {
  if (!Array.isArray(value)) return { success: false, error: "cycles must be an array" };
  if (value.length > MAX_CYCLES) return { success: false, error: "Too many cycles" };
  const out: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) return { success: false, error: "Invalid cycle entry" };
    if (!Array.isArray(item.nodes) || item.nodes.length === 0 || item.nodes.length > 100) {
      return { success: false, error: "Invalid cycle.nodes" };
    }
    const nodes: string[] = [];
    for (const node of item.nodes) {
      const checked = requireString(node, "cycle.node", 200);
      if (!checked.success || !checked.data) return { success: false, error: checked.error };
      nodes.push(checked.data);
    }
    const sanitized: Record<string, unknown> = { nodes };
    if (item.message !== undefined) {
      const message = requireString(item.message, "cycle.message", 500);
      if (!message.success || !message.data) return { success: false, error: message.error };
      sanitized.message = message.data;
    }
    out.push(sanitized);
  }
  return { success: true, data: out };
}

export function normalizeProjectId(projectId: string): string | null {
  const trimmed = projectId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateBlueprintUpdateInput(
  updateInput: BlueprintUpdateInput,
): BlueprintServiceResult<BlueprintUpdateInput> {
  if (!isPlainObject(updateInput)) {
    return { success: false, error: "Invalid blueprint payload" };
  }

  const measured = measureJson(updateInput);
  if (!measured.success || measured.data === undefined) {
    return { success: false, error: measured.error };
  }
  if (measured.data > MAX_JSON_CHARS) {
    return { success: false, error: "Blueprint payload too large" };
  }

  const sanitized: Record<string, unknown> = {};
  const keys = Object.keys(updateInput);
  if (keys.length === 0) {
    return { success: false, error: "Blueprint payload is empty" };
  }

  for (const key of keys) {
    const value = updateInput[key];
    if (value === undefined || typeof value === "function") {
      return { success: false, error: "Invalid blueprint payload" };
    }
    if (key === "components") {
      const components = sanitizeComponents(value);
      if (!components.success || !components.data) {
        return { success: false, error: components.error };
      }
      sanitized.components = components.data;
      continue;
    }
    if (key === "violations") {
      const violations = sanitizeViolations(value);
      if (!violations.success || !violations.data) {
        return { success: false, error: violations.error };
      }
      sanitized.violations = violations.data;
      continue;
    }
    if (key === "cycles") {
      const cycles = sanitizeCycles(value);
      if (!cycles.success || !cycles.data) {
        return { success: false, error: cycles.error };
      }
      sanitized.cycles = cycles.data;
      continue;
    }
    return { success: false, error: `Unexpected field: ${key}` };
  }

  if (Object.keys(sanitized).length === 0) {
    return { success: false, error: "Blueprint payload is empty" };
  }
  return { success: true, data: sanitized as BlueprintUpdateInput };
}
