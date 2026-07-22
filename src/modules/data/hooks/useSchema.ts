/**
 * useSchema — race-safe schema state for the data product slice.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { DataSchema, DataSchemaUpdateInput } from "../types";
import { dataApiAdapter } from "../services/data.api-adapter";
import type { DataApiPort } from "../services/data.port";
import { fetchSchema, normalizeProjectId, saveSchema } from "../services/data.service";

export function useSchema(projectId: string | null, port: DataApiPort = dataApiAdapter) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const projectRef = useRef(resolvedId);
  projectRef.current = resolvedId;

  const [schema, setSchema] = useState<DataSchema | null>(null);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    const id = projectRef.current;
    if (!id) {
      if (token === requestGeneration.current) {
        setSchema(null);
        setError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const result = await fetchSchema(id, port);
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      if (result.success && result.data) {
        setSchema(result.data);
        setError(null);
      } else {
        setSchema(null);
        setError(result.error || "Failed to fetch schema");
      }
    } catch (err) {
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      setSchema(null);
      setError(err instanceof Error ? err.message : "Failed to fetch schema");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    setSchema(null);
    setError(null);
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, refresh]);

  const updateSchema = async (data: DataSchemaUpdateInput) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const result = await saveSchema(id, data, port);
      if (result.success && projectRef.current === id) await refresh();
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update schema",
      };
    }
  };

  return { schema, loading, error, refresh, updateSchema };
}
