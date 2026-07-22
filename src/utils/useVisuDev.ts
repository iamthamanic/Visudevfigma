/**
 * VisuDEV React Hooks
 * Custom hooks for Edge Function integration
 */

import { useState, useEffect, useCallback } from "react";
import type { IntegrationsState } from "../lib/visudev/integrations";
import { api } from "./api";

/** Projects hooks live in `src/modules/projects` — import from the slice public entry. */

/** Appflow hooks live in `src/modules/appflow` — import from the slice public entry. */

/** Blueprint hooks live in `src/modules/blueprint` — import from the slice public entry. */

/** Data hooks live in `src/modules/data` — import from the slice public entry. */

/** Logs hook lives in `src/modules/logs` — import from the slice public entry. */

// ==================== INTEGRATIONS ====================

export function useIntegrations(projectId: string | null) {
  const [integrations, setIntegrations] = useState<IntegrationsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.integrations.get(projectId);
    if (result.success && result.data) {
      setIntegrations(result.data);
      setError(null);
    } else {
      setIntegrations(null);
      setError(result.error || "Failed to fetch integrations");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchIntegrations();
  }, [fetchIntegrations]);

  const connectGitHub = async (token: string, username?: string) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.integrations.github.connect(projectId, token, username);
    if (result.success) {
      await fetchIntegrations();
    }
    return result;
  };

  const disconnectGitHub = async () => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.integrations.github.disconnect(projectId);
    if (result.success) {
      await fetchIntegrations();
    }
    return result;
  };

  const connectSupabase = async (
    url: string,
    anonKey: string,
    serviceKey?: string,
    projectRef?: string,
  ) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.integrations.supabase.connect(
      projectId,
      url,
      anonKey,
      serviceKey,
      projectRef,
    );
    if (result.success) {
      await fetchIntegrations();
    }
    return result;
  };

  const disconnectSupabase = async () => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.integrations.supabase.disconnect(projectId);
    if (result.success) {
      await fetchIntegrations();
    }
    return result;
  };

  return {
    integrations,
    loading,
    error,
    refresh: fetchIntegrations,
    connectGitHub,
    disconnectGitHub,
    connectSupabase,
    disconnectSupabase,
  };
}
