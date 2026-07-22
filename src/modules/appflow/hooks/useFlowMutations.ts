/**
 * useFlowMutations — create/update/delete for the active project; refresh after success.
 * Kept separate from list-state so load/race logic and mutation workflows stay apart (SRP).
 */
import type { MutableRefObject } from "react";
import type { AppFlowCreateInput, AppFlowUpdateInput } from "../types";
import type { AppflowApiPort } from "../services/appflow.port";
import { createFlow, deleteFlow, updateFlow } from "../services/appflow.service";

type RefreshFn = () => Promise<void>;

export function useFlowMutations(
  projectRef: MutableRefObject<string | null>,
  refresh: RefreshFn,
  port: AppflowApiPort,
) {
  const createFlowAction = async (data: AppFlowCreateInput) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await createFlow(id, data, port);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create flow",
      };
    }
  };

  const updateFlowAction = async (flowId: string, data: AppFlowUpdateInput) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await updateFlow(id, flowId, data, port);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update flow",
      };
    }
  };

  const deleteFlowAction = async (flowId: string) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await deleteFlow(id, flowId, port);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete flow",
      };
    }
  };

  return {
    createFlow: createFlowAction,
    updateFlow: updateFlowAction,
    deleteFlow: deleteFlowAction,
  };
}
