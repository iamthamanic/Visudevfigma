/**
 * VisuDEV React Hooks
 * Custom hooks for Edge Function integration
 */

import { useState, useEffect } from 'react';
import { api } from './api';

// ==================== PROJECTS ====================

export function useProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    const result = await api.projects.getAll();
    if (result.success) {
      setProjects(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch projects');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (data: any) => {
    const result = await api.projects.create(data);
    if (result.success) {
      await fetchProjects();
    }
    return result;
  };

  const updateProject = async (id: string, data: any) => {
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
  const [project, setProject] = useState<any>(null);
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
      if (result.success) {
        setProject(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch project');
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}

// ==================== APPFLOW ====================

export function useFlows(projectId: string | null) {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.appflow.getAll(projectId);
    if (result.success) {
      setFlows(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch flows');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlows();
  }, [projectId]);

  const createFlow = async (data: any) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    const result = await api.appflow.create(projectId, data);
    if (result.success) {
      await fetchFlows();
    }
    return result;
  };

  const updateFlow = async (flowId: string, data: any) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    const result = await api.appflow.update(projectId, flowId, data);
    if (result.success) {
      await fetchFlows();
    }
    return result;
  };

  const deleteFlow = async (flowId: string) => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
  const [blueprint, setBlueprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprint = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.blueprint.get(projectId);
    if (result.success) {
      setBlueprint(result.data);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch blueprint');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBlueprint();
  }, [projectId]);

  const updateBlueprint = async (data: any) => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.data.getSchema(projectId);
    if (result.success) {
      setSchema(result.data);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch schema');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchema();
  }, [projectId]);

  const updateSchema = async (data: any) => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
  const [migrations, setMigrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMigrations = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.data.getMigrations(projectId);
    if (result.success) {
      setMigrations(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch migrations');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMigrations();
  }, [projectId]);

  return {
    migrations,
    loading,
    error,
    refresh: fetchMigrations,
  };
}

export function useERD(projectId: string | null) {
  const [erd, setERD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchERD = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.data.getERD(projectId);
    if (result.success) {
      setERD(result.data);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch ERD');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchERD();
  }, [projectId]);

  const updateERD = async (data: any) => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.logs.getAll(projectId);
    if (result.success) {
      setLogs(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch logs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  const createLog = async (data: any) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    const result = await api.logs.create(projectId, data);
    if (result.success) {
      await fetchLogs();
    }
    return result;
  };

  const deleteAllLogs = async () => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    if (!projectId) return;
    setLoading(true);
    const result = await api.integrations.get(projectId);
    if (result.success) {
      setIntegrations(result.data);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch integrations');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegrations();
  }, [projectId]);

  const connectGitHub = async (token: string, username?: string) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    const result = await api.integrations.github.connect(projectId, token, username);
    if (result.success) {
      await fetchIntegrations();
    }
    return result;
  };

  const disconnectGitHub = async () => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
    projectRef?: string
  ) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    const result = await api.integrations.supabase.connect(
      projectId,
      url,
      anonKey,
      serviceKey,
      projectRef
    );
    if (result.success) {
      await fetchIntegrations();
    }
    return result;
  };

  const disconnectSupabase = async () => {
    if (!projectId) return { success: false, error: 'No project ID' };
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
