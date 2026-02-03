export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  projectId: string;
  level?: LogLevel | string;
  message?: string;
}

export type LogCreateInput = Omit<LogEntry, "id" | "timestamp" | "projectId"> &
  Record<string, unknown>;
