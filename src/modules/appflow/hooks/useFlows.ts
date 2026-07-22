/**
 * useFlows — race-safe appflow list state; composes mutations from useFlowMutations.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppFlowRecord } from "../types";
import { appflowApiAdapter } from "../services/appflow.api-adapter";
import type { AppflowApiPort } from "../services/appflow.port";
import { fetchFlows, normalizeProjectId } from "../services/appflow.service";
import { useFlowMutations } from "./useFlowMutations";

export function useFlows(projectId: string | null, port: AppflowApiPort = appflowApiAdapter) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const projectRef = useRef(resolvedId);
  projectRef.current = resolvedId;

  const [flows, setFlows] = useState<AppFlowRecord[]>([]);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    const id = projectRef.current;
    if (!id) {
      if (token === requestGeneration.current) {
        setFlows([]);
        setError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const result = await fetchFlows(id, port);
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      if (result.success) {
        setFlows(result.data || []);
        setError(null);
      } else {
        setFlows([]);
        setError(result.error || "Failed to fetch flows");
      }
    } catch (err) {
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      setFlows([]);
      setError(err instanceof Error ? err.message : "Failed to fetch flows");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    setFlows([]);
    setError(null);
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, refresh]);

  const mutations = useFlowMutations(projectRef, refresh, port);

  return {
    flows,
    loading,
    error,
    refresh,
    ...mutations,
  };
}
