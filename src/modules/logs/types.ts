export interface LogEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  projectId: string;
}

export type LogCreateInput = Omit<LogEntry, "id" | "timestamp" | "projectId"> &
  Record<string, unknown>;
