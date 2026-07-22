/**
 * useBlueprint — race-safe blueprint fetch/update; port injectable for DIP.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { BlueprintData, BlueprintUpdateInput } from "../types";
import { blueprintApiAdapter } from "../services/blueprint.api-adapter";
import { toSafeClientError } from "../services/blueprint.errors";
import type { BlueprintApiPort } from "../services/blueprint.port";
import { fetchBlueprint, normalizeProjectId, saveBlueprint } from "../services/blueprint.service";

export function useBlueprint(
  projectId: string | null,
  port: BlueprintApiPort = blueprintApiAdapter,
) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const projectRef = useRef(resolvedId);
  projectRef.current = resolvedId;

  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    const id = projectRef.current;
    if (!id) {
      if (token === requestGeneration.current) {
        setBlueprint(null);
        setError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const fetchResult = await fetchBlueprint(id, port);
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      if (fetchResult.success && fetchResult.data) {
        setBlueprint(fetchResult.data);
        setError(null);
      } else {
        setBlueprint(null);
        setError(toSafeClientError(fetchResult.error, "Failed to fetch blueprint"));
      }
    } catch {
      if (token !== requestGeneration.current || projectRef.current !== id) return;
      setBlueprint(null);
      setError("Failed to fetch blueprint");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    setBlueprint(null);
    setError(null);
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, refresh]);

  const updateBlueprint = async (updateInput: BlueprintUpdateInput) => {
    const id = projectRef.current;
    if (!id) return { success: false, error: "No project ID" };
    try {
      const mutationResult = await saveBlueprint(id, updateInput, port);
      if (mutationResult.success && projectRef.current === id) await refresh();
      return mutationResult.success
        ? mutationResult
        : {
            success: false,
            error: toSafeClientError(mutationResult.error, "Failed to update blueprint"),
          };
    } catch {
      return { success: false, error: "Failed to update blueprint" };
    }
  };

  return {
    blueprint,
    loading,
    error,
    refresh,
    updateBlueprint,
  };
}
