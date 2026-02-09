export type CodeFlowType =
  | "ui-event"
  | "function-call"
  | "api-call"
  | "db-query";

export interface CodeFlow {
  id: string;
  type: CodeFlowType;
  name: string;
  file: string;
  line: number;
  code: string;
  calls: string[];
  color: string;
}
