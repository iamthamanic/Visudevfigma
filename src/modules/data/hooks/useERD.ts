/**
 * useERD — race-safe ERD state for the data slice across local/cloud adapters.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ERDData, ERDUpdateInput } from "../types";
import { dataApiAdapter } from "../services/data.api-adapter";
import type { DataApiPort } from "../services/data.port";
import { fetchERD, normalizeProjectId, saveERD } from "../services/data.service";

export function useERD(projectId: string | null, port: DataApiPort = dataApiAdapter) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const projectRef = useRef(resolvedId);
  projectRef.current = resolvedId;

  const [erd, setERD] = useState<ERDData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    const id = projectRef.current;
    if (!id) {
      if (token === requestGeneration.current) {
        setERD(null);
        setError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const result = await fetchERD(id, port);
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      if (result.success && result.data) {
        setERD(result.data);
        setError(null);
      } else {
        setERD(null);
        setError(result.error || "Failed to fetch ERD");
      }
    } catch (err) {
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      setERD(null);
      setError(err instanceof Error ? err.message : "Failed to fetch ERD");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    setERD(null);
    setError(null);
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, refresh]);

  const updateERD = async (data: ERDUpdateInput) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await saveERD(id, data, port);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update ERD",
      };
    }
  };

  return { erd, loading, error, refresh, updateERD };
}
