/**
 * Why: keep project payload whitelist and field rules apart from port CRUD
 * orchestration so validation can evolve without touching transport.
 */
import type { ProjectCreateInput, ProjectUpdateInput } from "../types";
import type { ProjectsServiceResult } from "./projects.port";

const MAX_JSON_CHARS = 200_000;
const MAX_NAME = 500;
const MAX_DESCRIPTION = 2000;
const MAX_PATH = 2000;
const MAX_REPO = 500;
const MAX_BRANCH = 200;
const MAX_TOKEN = 500;
const MAX_URL = 2000;
const MAX_SUPABASE_ID = 100;
const MAX_KEY = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SOURCE_MODES = new Set(["github", "local"]);
const PREVIEW_MODES = new Set(["auto", "local", "central", "deployed"]);
const DATABASE_TYPES = new Set(["supabase", "local", "none"]);
const BLUEPRINT_PROVIDERS = new Set(["legacy-blueprint-runner", "autoguide"]);

const CREATE_KEYS = new Set([
  "id",
  "name",
  "description",
  "source_mode",
  "local_path",
  "github_repo",
  "github_branch",
  "github_access_token",
  "deployed_url",
  "preview_mode",
  "database_type",
  "blueprint_provider_id",
  "supabase_project_id",
  "supabase_anon_key",
  "supabase_management_token",
]);

const UPDATE_KEYS = new Set([...CREATE_KEYS].filter((k) => k !== "id"));

export function normalizeProjectId(projectId: string): string | null {
  const trimmed = projectId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function measureJson(value: unknown): { ok: true; size: number } | { ok: false; error: string } {
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") {
      return { ok: false, error: "Invalid project payload" };
    }
    return { ok: true, size: serialized.length };
  } catch {
    return { ok: false, error: "Invalid project payload" };
  }
}

function validateOptionalString(
  value: unknown,
  field: string,
  max: number,
): ProjectsServiceResult<string | undefined> {
  if (value === undefined) return { success: true, data: undefined };
  if (typeof value !== "string") return { success: false, error: `${field} must be a string` };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { success: false, error: `${field} must not be empty` };
  if (trimmed.length > max) return { success: false, error: `${field} too long` };
  return { success: true, data: trimmed };
}

function sanitizeProjectPayload(
  payload: Record<string, unknown>,
  allowed: Set<string>,
  requireNonEmpty: boolean,
): ProjectsServiceResult<Record<string, unknown>> {
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) {
      return { success: false, error: `Unexpected field: ${key}` };
    }
  }

  const measured = measureJson(payload);
  if (!measured.ok) return { success: false, error: measured.error };
  if (measured.size > MAX_JSON_CHARS) {
    return { success: false, error: "Project payload too large" };
  }

  const sanitized: Record<string, unknown> = {};

  if (allowed.has("id") && payload.id !== undefined) {
    if (typeof payload.id !== "string" || !UUID_RE.test(payload.id.trim())) {
      return { success: false, error: "Invalid project id" };
    }
    sanitized.id = payload.id.trim();
  }

  const name = validateOptionalString(payload.name, "name", MAX_NAME);
  if (!name.success) return { success: false, error: name.error };
  if (name.data !== undefined) sanitized.name = name.data;

  const description = validateOptionalString(payload.description, "description", MAX_DESCRIPTION);
  if (!description.success) return { success: false, error: description.error };
  if (description.data !== undefined) sanitized.description = description.data;

  if (payload.source_mode !== undefined) {
    if (typeof payload.source_mode !== "string" || !SOURCE_MODES.has(payload.source_mode)) {
      return { success: false, error: "Invalid source_mode" };
    }
    sanitized.source_mode = payload.source_mode;
  }

  const stringFields: Array<[string, number]> = [
    ["local_path", MAX_PATH],
    ["github_repo", MAX_REPO],
    ["github_branch", MAX_BRANCH],
    ["github_access_token", MAX_TOKEN],
    ["deployed_url", MAX_URL],
    ["supabase_project_id", MAX_SUPABASE_ID],
    ["supabase_anon_key", MAX_KEY],
    ["supabase_management_token", MAX_KEY],
  ];
  for (const [field, max] of stringFields) {
    if (!allowed.has(field)) continue;
    const checked = validateOptionalString(payload[field], field, max);
    if (!checked.success) return { success: false, error: checked.error };
    if (checked.data !== undefined) sanitized[field] = checked.data;
  }

  if (payload.preview_mode !== undefined) {
    if (typeof payload.preview_mode !== "string" || !PREVIEW_MODES.has(payload.preview_mode)) {
      return { success: false, error: "Invalid preview_mode" };
    }
    sanitized.preview_mode = payload.preview_mode;
  }

  if (payload.database_type !== undefined) {
    if (typeof payload.database_type !== "string" || !DATABASE_TYPES.has(payload.database_type)) {
      return { success: false, error: "Invalid database_type" };
    }
    sanitized.database_type = payload.database_type;
  }

  if (payload.blueprint_provider_id !== undefined) {
    if (
      typeof payload.blueprint_provider_id !== "string" ||
      !BLUEPRINT_PROVIDERS.has(payload.blueprint_provider_id)
    ) {
      return { success: false, error: "Invalid blueprint_provider_id" };
    }
    sanitized.blueprint_provider_id = payload.blueprint_provider_id;
  }

  if (requireNonEmpty && Object.keys(sanitized).length === 0) {
    return { success: false, error: "Project payload is empty" };
  }

  return { success: true, data: sanitized };
}

export function validateProjectCreateInput(
  createInput: ProjectCreateInput,
): ProjectsServiceResult<ProjectCreateInput> {
  if (!isPlainObject(createInput)) {
    return { success: false, error: "Invalid project payload" };
  }
  const sanitized = sanitizeProjectPayload(createInput, CREATE_KEYS, true);
  if (!sanitized.success || !sanitized.data) {
    return { success: false, error: sanitized.error };
  }
  if (typeof sanitized.data.name !== "string" || sanitized.data.name.length === 0) {
    return { success: false, error: "Project name is required" };
  }
  return { success: true, data: sanitized.data as ProjectCreateInput };
}

export function validateProjectUpdateInput(
  updateInput: ProjectUpdateInput,
): ProjectsServiceResult<ProjectUpdateInput> {
  if (!isPlainObject(updateInput)) {
    return { success: false, error: "Invalid project payload" };
  }
  const sanitized = sanitizeProjectPayload(updateInput, UPDATE_KEYS, true);
  if (!sanitized.success || !sanitized.data) {
    return { success: false, error: sanitized.error };
  }
  return { success: true, data: sanitized.data as ProjectUpdateInput };
}
