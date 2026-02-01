export interface AppFlowRecord extends Record<string, unknown> {
  flowId: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppFlowCreateInput = Omit<AppFlowRecord, "projectId" | "createdAt" | "updatedAt"> & {
  flowId?: string;
};

export type AppFlowUpdateInput = Partial<Omit<AppFlowRecord, "flowId" | "projectId" | "createdAt">>;
