/**
 * useMigrations — race-safe migrations list for the data product slice.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { MigrationEntry } from "../types";
import { dataApiAdapter } from "../services/data.api-adapter";
import type { DataApiPort } from "../services/data.port";
import { fetchMigrations, normalizeProjectId, saveMigrations } from "../services/data.service";

export function useMigrations(projectId: string | null, port: DataApiPort = dataApiAdapter) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const projectRef = useRef(resolvedId);
  projectRef.current = resolvedId;

  const [migrations, setMigrations] = useState<MigrationEntry[]>([]);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    const id = projectRef.current;
    if (!id) {
      if (token === requestGeneration.current) {
        setMigrations([]);
        setError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const result = await fetchMigrations(id, port);
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      if (result.success) {
        setMigrations(result.data || []);
        setError(null);
      } else {
        setMigrations([]);
        setError(result.error || "Failed to fetch migrations");
      }
    } catch (err) {
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      setMigrations([]);
      setError(err instanceof Error ? err.message : "Failed to fetch migrations");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    setMigrations([]);
    setError(null);
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, refresh]);

  const updateMigrations = async (data: MigrationEntry[]) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await saveMigrations(id, data, port);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update migrations",
      };
    }
  };

  return { migrations, loading, error, refresh, updateMigrations };
}
