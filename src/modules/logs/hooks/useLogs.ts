/**
 * useLogs — race-safe project log state: bumps a request generation on
 * project change/unmount so late responses cannot overwrite the active project.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { LogCreateInput, LogEntry } from "../types";
import { logsApiAdapter } from "../services/logs.api-adapter";
import {
  createProjectLog,
  deleteAllProjectLogs,
  fetchProjectLogs,
  normalizeProjectId,
} from "../services/logs.service";

export function useLogs(projectId: string | null) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const projectRef = useRef(resolvedId);
  projectRef.current = resolvedId;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    const id = projectRef.current;
    if (!id) {
      if (token === requestGeneration.current) {
        setLogs([]);
        setError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const result = await fetchProjectLogs(id, logsApiAdapter);
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      if (result.success) {
        setLogs(result.data || []);
        setError(null);
      } else {
        setLogs([]);
        setError(result.error || "Failed to fetch logs");
      }
    } catch (err) {
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      setLogs([]);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLogs([]);
    setError(null);
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, refresh]);

  const createLog = async (data: LogCreateInput) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await createProjectLog(id, data, logsApiAdapter);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create log",
      };
    }
  };

  const deleteAllLogs = async () => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await deleteAllProjectLogs(id, logsApiAdapter);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete logs",
      };
    }
  };

  return { logs, loading, error, refresh, createLog, deleteAllLogs };
}
