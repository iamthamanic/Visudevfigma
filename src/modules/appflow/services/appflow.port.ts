/**
 * Port contract so appflow domain code depends on behavior, not the legacy facade.
 */
import type { AppFlowCreateInput, AppFlowRecord, AppFlowUpdateInput } from "../types";

export type AppflowServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type AppflowApiPort = {
  getAll: (projectId: string) => Promise<AppflowServiceResult<AppFlowRecord[]>>;
  create: (projectId: string, data: AppFlowCreateInput) => Promise<AppflowServiceResult<unknown>>;
  update: (
    projectId: string,
    flowId: string,
    data: AppFlowUpdateInput,
  ) => Promise<AppflowServiceResult<unknown>>;
  delete: (projectId: string, flowId: string) => Promise<AppflowServiceResult<unknown>>;
};
