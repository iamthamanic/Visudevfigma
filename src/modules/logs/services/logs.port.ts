/**
 * Port contract so logs domain code depends on behavior, not the legacy facade.
 */
import type { LogCreateInput, LogEntry } from "../types";

export type LogsServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type LogsApiPort = {
  getAll: (projectId: string) => Promise<LogsServiceResult<LogEntry[]>>;
  create: (projectId: string, data: LogCreateInput) => Promise<LogsServiceResult<unknown>>;
  deleteAll: (projectId: string) => Promise<LogsServiceResult<unknown>>;
};
