/**
 * Why: enforce projectId/payload rules before a runtime call, and require
 * an explicit port so production wiring and tests share the same path.
 */
import type { LogCreateInput, LogLevel } from "../types";
import type { LogsApiPort, LogsServiceResult } from "./logs.port";

export type { LogsApiPort, LogsServiceResult } from "./logs.port";

const MAX_LOG_MESSAGE_CHARS = 8_000;
const ALLOWED_LEVELS = new Set<string>(["INFO", "WARN", "ERROR", "DEBUG"]);

export function normalizeProjectId(projectId: string): string | null {
  const trimmed = projectId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateLogCreateInput(data: LogCreateInput): LogsServiceResult<LogCreateInput> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { success: false, error: "Invalid log payload" };
  }

  if (data.message === undefined || typeof data.message !== "string") {
    return { success: false, error: "Log message is required" };
  }
  const trimmedMessage = data.message.trim();
  if (trimmedMessage.length === 0) {
    return { success: false, error: "Log message is required" };
  }
  if (trimmedMessage.length > MAX_LOG_MESSAGE_CHARS) {
    return { success: false, error: "Log message too long" };
  }
  const message = trimmedMessage;

  let level: LogLevel | undefined;
  if (data.level !== undefined) {
    if (typeof data.level !== "string") {
      return { success: false, error: "Log level must be a string" };
    }
    const normalized = data.level.trim().toUpperCase();
    if (!ALLOWED_LEVELS.has(normalized)) {
      return { success: false, error: "Invalid log level" };
    }
    level = normalized as LogLevel;
  }

  // Only forward known fields — drop unexpected keys at the slice boundary.
  const sanitized: LogCreateInput = { message };
  if (level !== undefined) sanitized.level = level;
  return { success: true, data: sanitized };
}

export async function fetchProjectLogs(
  projectId: string,
  port: LogsApiPort,
): Promise<LogsServiceResult<import("../types").LogEntry[]>> {
  const id = normalizeProjectId(projectId);
  if (!id) return { success: false, error: "No project ID" };
  return port.getAll(id);
}

export async function createProjectLog(
  projectId: string,
  data: LogCreateInput,
  port: LogsApiPort,
): Promise<LogsServiceResult<unknown>> {
  const id = normalizeProjectId(projectId);
  if (!id) return { success: false, error: "No project ID" };
  const validated = validateLogCreateInput(data);
  if (!validated.success || !validated.data) {
    return { success: false, error: validated.error };
  }
  return port.create(id, validated.data);
}

export async function deleteAllProjectLogs(
  projectId: string,
  port: LogsApiPort,
): Promise<LogsServiceResult<unknown>> {
  const id = normalizeProjectId(projectId);
  if (!id) return { success: false, error: "No project ID" };
  return port.deleteAll(id);
}
