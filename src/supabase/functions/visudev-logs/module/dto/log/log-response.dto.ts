export type LogResponseDto = Record<string, unknown> & {
  id: string;
  projectId: string;
  timestamp: string;
};
