/**
 * Why: enforce whitelist fields matching server createAppFlowBodySchema before
 * a runtime call; require an explicit port for DIP/testability.
 */
import type { AppFlowCreateInput, AppFlowRecord, AppFlowUpdateInput } from "../types";
import type { AppflowApiPort, AppflowServiceResult } from "./appflow.port";

export type { AppflowApiPort, AppflowServiceResult } from "./appflow.port";

const MAX_JSON_CHARS = 200_000;
const MAX_FLOW_ID_CHARS = 200;
const MAX_FRAMEWORK_CHARS = 100;
const MAX_ARRAY_ITEMS = 200;
const MAX_SCREEN_ID_CHARS = 200;
const MAX_FLOW_ITEM_ID_CHARS = 200;
const MAX_NAME_CHARS = 200;
const MAX_PATH_CHARS = 500;
const MAX_CODE_CHARS = 10_000;
const MAX_COMPONENT_CHARS = 50_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CREATE_KEYS = new Set(["flowId", "screens", "flows", "framework"]);
const UPDATE_KEYS = new Set(["screens", "flows", "framework", "updatedAt"]);

export function normalizeProjectId(projectId: string): string | null {
  const trimmed = projectId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeFlowId(flowId: string): string | null {
  const trimmed = flowId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function measureJson(value: unknown): { ok: true; size: number } | { ok: false; error: string } {
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") {
      return { ok: false, error: "Invalid flow payload" };
    }
    return { ok: true, size: serialized.length };
  } catch {
    return { ok: false, error: "Invalid flow payload" };
  }
}

function requireProjectId(projectId: string): AppflowServiceResult<string> {
  const id = normalizeProjectId(projectId);
  if (!id) return { success: false, error: "No project ID" };
  return { success: true, data: id };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function rejectUnknownKeys(
  data: Record<string, unknown>,
  allowed: Set<string>,
): AppflowServiceResult<void> {
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) {
      return { success: false, error: `Unexpected field: ${key}` };
    }
  }
  return { success: true };
}

function validateOptionalString(
  value: unknown,
  field: string,
  max: number,
): AppflowServiceResult<string | undefined> {
  if (value === undefined) return { success: true, data: undefined };
  if (typeof value !== "string") return { success: false, error: `${field} must be a string` };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { success: false, error: `${field} must not be empty` };
  if (trimmed.length > max) return { success: false, error: `${field} too long` };
  return { success: true, data: trimmed };
}

const SCREEN_STRING_FIELDS = {
  name: MAX_NAME_CHARS,
  path: MAX_PATH_CHARS,
  file: MAX_PATH_CHARS,
  screenshotUrl: 2000,
  filePath: MAX_PATH_CHARS,
  framework: MAX_FRAMEWORK_CHARS,
  lastScreenshotCommit: 100,
} as const;

const SCREENSHOT_STATUSES = new Set(["none", "pending", "ok", "failed"]);
const SCREEN_TYPES = new Set(["page", "screen", "view"]);
const FLOW_TYPES = new Set(["ui-event", "function-call", "api-call", "db-query"]);

function validateStringArray(
  value: unknown,
  field: string,
  maxItems: number,
): AppflowServiceResult<string[] | undefined> {
  if (value === undefined) return { success: true, data: undefined };
  if (!Array.isArray(value)) return { success: false, error: `${field} must be an array` };
  if (value.length > maxItems) return { success: false, error: `${field} too long` };
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim().length === 0 || entry.length > 200) {
      return { success: false, error: `Invalid ${field} entry` };
    }
    out.push(entry.trim());
  }
  return { success: true, data: out };
}

function sanitizeScreen(
  item: Record<string, unknown>,
): AppflowServiceResult<Record<string, unknown>> {
  const id = validateOptionalString(item.id, "screen.id", MAX_SCREEN_ID_CHARS);
  if (!id.success || id.data === undefined) {
    return { success: false, error: id.error || "screen.id is required" };
  }
  const sanitized: Record<string, unknown> = { id: id.data };

  for (const [field, max] of Object.entries(SCREEN_STRING_FIELDS)) {
    const checked = validateOptionalString(item[field], `screen.${field}`, max);
    if (!checked.success) return { success: false, error: checked.error };
    if (checked.data !== undefined) sanitized[field] = checked.data;
  }

  if (item.screenshotStatus !== undefined) {
    if (
      typeof item.screenshotStatus !== "string" ||
      !SCREENSHOT_STATUSES.has(item.screenshotStatus)
    ) {
      return { success: false, error: "Invalid screen.screenshotStatus" };
    }
    sanitized.screenshotStatus = item.screenshotStatus;
  }

  if (item.type !== undefined) {
    if (typeof item.type !== "string" || !SCREEN_TYPES.has(item.type)) {
      return { success: false, error: "Invalid screen.type" };
    }
    sanitized.type = item.type;
  }

  if (item.componentCode !== undefined) {
    const code = validateOptionalString(
      item.componentCode,
      "screen.componentCode",
      MAX_COMPONENT_CHARS,
    );
    if (!code.success) return { success: false, error: code.error };
    if (code.data !== undefined) sanitized.componentCode = code.data;
  }

  const flows = validateStringArray(item.flows, "screen.flows", 100);
  if (!flows.success) return { success: false, error: flows.error };
  if (flows.data !== undefined) sanitized.flows = flows.data;

  const navigatesTo = validateStringArray(item.navigatesTo, "screen.navigatesTo", 100);
  if (!navigatesTo.success) return { success: false, error: navigatesTo.error };
  if (navigatesTo.data !== undefined) sanitized.navigatesTo = navigatesTo.data;

  if (item.depth !== undefined) {
    if (
      typeof item.depth !== "number" ||
      !Number.isInteger(item.depth) ||
      item.depth < 0 ||
      item.depth > 20
    ) {
      return { success: false, error: "Invalid screen.depth" };
    }
    sanitized.depth = item.depth;
  }

  return { success: true, data: sanitized };
}

function sanitizeFlowItem(
  item: Record<string, unknown>,
): AppflowServiceResult<Record<string, unknown>> {
  const id = validateOptionalString(item.id, "flow.id", MAX_FLOW_ITEM_ID_CHARS);
  if (!id.success || id.data === undefined) {
    return { success: false, error: id.error || "flow.id is required" };
  }
  const name = validateOptionalString(item.name, "flow.name", MAX_NAME_CHARS);
  if (!name.success || name.data === undefined) {
    return { success: false, error: name.error || "flow.name is required" };
  }
  if (typeof item.type !== "string" || !FLOW_TYPES.has(item.type)) {
    return { success: false, error: "Invalid flow.type" };
  }
  const file = validateOptionalString(item.file, "flow.file", MAX_PATH_CHARS);
  if (!file.success || file.data === undefined) {
    return { success: false, error: file.error || "flow.file is required" };
  }
  if (typeof item.line !== "number" || !Number.isInteger(item.line) || item.line < 0) {
    return { success: false, error: "Invalid flow.line" };
  }
  const code = validateOptionalString(item.code, "flow.code", MAX_CODE_CHARS);
  if (!code.success || code.data === undefined) {
    return { success: false, error: code.error || "flow.code is required" };
  }

  const sanitized: Record<string, unknown> = {
    id: id.data,
    type: item.type,
    name: name.data,
    file: file.data,
    line: item.line,
    code: code.data,
  };

  const calls = validateStringArray(item.calls, "flow.calls", 50);
  if (!calls.success) return { success: false, error: calls.error };
  if (calls.data !== undefined) sanitized.calls = calls.data;

  if (item.color !== undefined) {
    const color = validateOptionalString(item.color, "flow.color", 50);
    if (!color.success) return { success: false, error: color.error };
    if (color.data !== undefined) sanitized.color = color.data;
  }

  return { success: true, data: sanitized };
}

function validateScreens(value: unknown): AppflowServiceResult<unknown[] | undefined> {
  if (value === undefined) return { success: true, data: undefined };
  if (!Array.isArray(value)) return { success: false, error: "screens must be an array" };
  if (value.length > MAX_ARRAY_ITEMS) return { success: false, error: "Too many screens" };
  const out: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) return { success: false, error: "Invalid screen entry" };
    const sanitized = sanitizeScreen(item);
    if (!sanitized.success || !sanitized.data) {
      return { success: false, error: sanitized.error };
    }
    out.push(sanitized.data);
  }
  return { success: true, data: out };
}

function validateFlowItems(value: unknown): AppflowServiceResult<unknown[] | undefined> {
  if (value === undefined) return { success: true, data: undefined };
  if (!Array.isArray(value)) return { success: false, error: "flows must be an array" };
  if (value.length > MAX_ARRAY_ITEMS) return { success: false, error: "Too many flows" };
  const out: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) return { success: false, error: "Invalid flow entry" };
    const sanitized = sanitizeFlowItem(item);
    if (!sanitized.success || !sanitized.data) {
      return { success: false, error: sanitized.error };
    }
    out.push(sanitized.data);
  }
  return { success: true, data: out };
}

function sanitizePayload(
  data: Record<string, unknown>,
  allowed: Set<string>,
): AppflowServiceResult<Record<string, unknown>> {
  const keys = rejectUnknownKeys(data, allowed);
  if (!keys.success) return { success: false, error: keys.error };

  const measured = measureJson(data);
  if (!measured.ok) return { success: false, error: measured.error };
  if (measured.size > MAX_JSON_CHARS) {
    return { success: false, error: "Flow payload too large" };
  }

  const sanitized: Record<string, unknown> = {};

  if (allowed.has("flowId") && data.flowId !== undefined) {
    if (typeof data.flowId !== "string") {
      return { success: false, error: "Invalid flowId" };
    }
    const trimmed = data.flowId.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_FLOW_ID_CHARS || !UUID_RE.test(trimmed)) {
      return { success: false, error: "Invalid flowId" };
    }
    sanitized.flowId = trimmed;
  }

  if (data.framework !== undefined) {
    const framework = validateOptionalString(data.framework, "framework", MAX_FRAMEWORK_CHARS);
    if (!framework.success) return { success: false, error: framework.error };
    if (framework.data !== undefined) sanitized.framework = framework.data;
  }

  const screens = validateScreens(data.screens);
  if (!screens.success) return { success: false, error: screens.error };
  if (screens.data !== undefined) sanitized.screens = screens.data;

  const flows = validateFlowItems(data.flows);
  if (!flows.success) return { success: false, error: flows.error };
  if (flows.data !== undefined) sanitized.flows = flows.data;

  if (allowed.has("updatedAt") && data.updatedAt !== undefined) {
    const updatedAt = validateOptionalString(data.updatedAt, "updatedAt", 64);
    if (!updatedAt.success) return { success: false, error: updatedAt.error };
    if (updatedAt.data !== undefined) sanitized.updatedAt = updatedAt.data;
  }

  return { success: true, data: sanitized };
}

export function validateFlowCreateInput(
  data: AppFlowCreateInput,
): AppflowServiceResult<AppFlowCreateInput> {
  if (!isPlainObject(data)) {
    return { success: false, error: "Invalid flow payload" };
  }
  const sanitized = sanitizePayload(data, CREATE_KEYS);
  if (!sanitized.success || !sanitized.data) {
    return { success: false, error: sanitized.error };
  }
  return { success: true, data: sanitized.data as AppFlowCreateInput };
}

export function validateFlowUpdateInput(
  data: AppFlowUpdateInput,
): AppflowServiceResult<AppFlowUpdateInput> {
  if (!isPlainObject(data)) {
    return { success: false, error: "Invalid flow payload" };
  }
  const sanitized = sanitizePayload(data, UPDATE_KEYS);
  if (!sanitized.success || !sanitized.data) {
    return { success: false, error: sanitized.error };
  }
  if (Object.keys(sanitized.data).length === 0) {
    return { success: false, error: "Update payload is empty" };
  }
  return { success: true, data: sanitized.data as AppFlowUpdateInput };
}

export async function fetchFlows(
  projectId: string,
  port: AppflowApiPort,
): Promise<AppflowServiceResult<AppFlowRecord[]>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  return port.getAll(id.data);
}

export async function createFlow(
  projectId: string,
  data: AppFlowCreateInput,
  port: AppflowApiPort,
): Promise<AppflowServiceResult<unknown>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  const validated = validateFlowCreateInput(data);
  if (!validated.success || !validated.data) {
    return { success: false, error: validated.error };
  }
  return port.create(id.data, validated.data);
}

export async function updateFlow(
  projectId: string,
  flowId: string,
  data: AppFlowUpdateInput,
  port: AppflowApiPort,
): Promise<AppflowServiceResult<unknown>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  const fid = normalizeFlowId(flowId);
  if (!fid) return { success: false, error: "No flow ID" };
  const validated = validateFlowUpdateInput(data);
  if (!validated.success || !validated.data) {
    return { success: false, error: validated.error };
  }
  return port.update(id.data, fid, validated.data);
}

export async function deleteFlow(
  projectId: string,
  flowId: string,
  port: AppflowApiPort,
): Promise<AppflowServiceResult<unknown>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  const fid = normalizeFlowId(flowId);
  if (!fid) return { success: false, error: "No flow ID" };
  return port.delete(id.data, fid);
}
