/**
 * VisuDEV React Hooks
 * Custom hooks for Edge Function integration
 */

import { useState, useEffect, useCallback } from "react";
import type { IntegrationsState } from "../lib/visudev/integrations";
import type { Project } from "../lib/visudev/types";
import type {
  AppFlowCreateInput,
  AppFlowRecord,
  AppFlowUpdateInput,
} from "../modules/appflow/types";
import type { BlueprintData, BlueprintUpdateInput } from "../modules/blueprint/types";
import type {
  DataSchema,
  DataSchemaUpdateInput,
  ERDData,
  ERDUpdateInput,
  MigrationEntry,
} from "../modules/data/types";
import type { LogCreateInput, LogEntry } from "../modules/logs/types";
import type { ProjectCreateInput, ProjectUpdateInput } from "../modules/projects/types";
import { api } from "./api";

// ==================== PROJECTS ====================

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const result = await api.projects.getAll();
    if (result.success) {
      setProjects(result.data || []);
      setError(null);
    } else {
      setError(result.error || "Failed to fetch projects");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: ProjectCreateInput) => {
    const result = await api.projects.create(data);
    if (result.success) {
      await fetchProjects();
    }
    return result;
  };

  const updateProject = async (id: string, data: ProjectUpdateInput) => {
    const result = await api.projects.update(id, data);
    if (result.success) {
      await fetchProjects();
    }
    return result;
  };

  const deleteProject = async (id: string) => {
    const result = await api.projects.delete(id);
    if (result.success) {
      await fetchProjects();
    }
    return result;
  };

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      const result = await api.projects.get(projectId);
      if (result.success && result.data) {
        setProject(result.data);
        setError(null);
      } else {
        setProject(null);
        setError(result.error || "Failed to fetch project");
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}

// ==================== APPFLOW ====================

export function useFlows(projectId: string | null) {
  const [flows, setFlows] = useState<AppFlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.appflow.getAll(projectId);
    if (result.success) {
      setFlows(result.data || []);
      setError(null);
    } else {
      setError(result.error || "Failed to fetch flows");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchFlows();
  }, [fetchFlows]);

  const createFlow = async (data: AppFlowCreateInput) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.appflow.create(projectId, data);
    if (result.success) {
      await fetchFlows();
    }
    return result;
  };

  const updateFlow = async (flowId: string, data: AppFlowUpdateInput) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.appflow.update(projectId, flowId, data);
    if (result.success) {
      await fetchFlows();
    }
    return result;
  };

  const deleteFlow = async (flowId: string) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.appflow.delete(projectId, flowId);
    if (result.success) {
      await fetchFlows();
    }
    return result;
  };

  return {
    flows,
    loading,
    error,
    refresh: fetchFlows,
    createFlow,
    updateFlow,
    deleteFlow,
  };
}

// ==================== BLUEPRINT ====================

export function useBlueprint(projectId: string | null) {
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.blueprint.get(projectId);
    if (result.success && result.data) {
      setBlueprint(result.data);
      setError(null);
    } else {
      setBlueprint(null);
      setError(result.error || "Failed to fetch blueprint");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchBlueprint();
  }, [fetchBlueprint]);

  const updateBlueprint = async (data: BlueprintUpdateInput) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.blueprint.update(projectId, data);
    if (result.success) {
      await fetchBlueprint();
    }
    return result;
  };

  return {
    blueprint,
    loading,
    error,
    refresh: fetchBlueprint,
    updateBlueprint,
  };
}

// ==================== DATA ====================

export function useSchema(projectId: string | null) {
  const [schema, setSchema] = useState<DataSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.data.getSchema(projectId);
    if (result.success && result.data) {
      setSchema(result.data);
      setError(null);
    } else {
      setSchema(null);
      setError(result.error || "Failed to fetch schema");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchSchema();
  }, [fetchSchema]);

  const updateSchema = async (data: DataSchemaUpdateInput) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.data.updateSchema(projectId, data);
    if (result.success) {
      await fetchSchema();
    }
    return result;
  };

  return {
    schema,
    loading,
    error,
    refresh: fetchSchema,
    updateSchema,
  };
}

export function useMigrations(projectId: string | null) {
  const [migrations, setMigrations] = useState<MigrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMigrations = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.data.getMigrations(projectId);
    if (result.success) {
      setMigrations(result.data || []);
      setError(null);
    } else {
      setError(result.error || "Failed to fetch migrations");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchMigrations();
  }, [fetchMigrations]);

  return {
    migrations,
    loading,
    error,
    refresh: fetchMigrations,
  };
}

export function useERD(projectId: string | null) {
  const [erd, setERD] = useState<ERDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchERD = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.data.getERD(projectId);
    if (result.success && result.data) {
      setERD(result.data);
      setError(null);
    } else {
      setERD(null);
      setError(result.error || "Failed to fetch ERD");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchERD();
  }, [fetchERD]);

  const updateERD = async (data: ERDUpdateInput) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.data.updateERD(projectId, data);
    if (result.success) {
      await fetchERD();
    }
    return result;
  };

  return {
    erd,
    loading,
    error,
    refresh: fetchERD,
    updateERD,
  };
}

// ==================== LOGS ====================

export function useLogs(projectId: string | null) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.logs.getAll(projectId);
    if (result.success) {
      setLogs(result.data || []);
      setError(null);
    } else {
      setError(result.error || "Failed to fetch logs");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const createLog = async (data: LogCreateInput) => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.logs.create(projectId, data);
    if (result.success) {
      await fetchLogs();
    }
    return result;
  };

  const deleteAllLogs = async () => {
    if (!projectId) return { success: false, error: "No project ID" };
    const result = await api.logs.deleteAll(projectId);
    if (result.success) {
      await fetchLogs();
    }
    return result;
  };

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs,
    createLog,
    deleteAllLogs,
  };
}

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
