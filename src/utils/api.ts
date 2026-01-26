/**
 * VisuDEV API Client
 * Frontend integration for all Edge Functions
 */

import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1`;

// Base fetch wrapper with auth
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, result.error || response.statusText);
      return { success: false, error: result.error || response.statusText };
    }

    return result;
  } catch (error) {
    console.error(`Network Error [${endpoint}]:`, error);
    return { success: false, error: String(error) };
  }
}

// ==================== PROJECTS ====================

export const projectsAPI = {
  // Get all projects
  getAll: () => apiRequest('/visudev-projects'),

  // Get single project
  get: (id: string) => apiRequest(`/visudev-projects/${id}`),

  // Create project
  create: (data: any) =>
    apiRequest('/visudev-projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update project
  update: (id: string, data: any) =>
    apiRequest(`/visudev-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete project
  delete: (id: string) =>
    apiRequest(`/visudev-projects/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== APP FLOW ====================

export const appflowAPI = {
  // Get all flows for project
  getAll: (projectId: string) => apiRequest(`/visudev-appflow/${projectId}`),

  // Get single flow
  get: (projectId: string, flowId: string) =>
    apiRequest(`/visudev-appflow/${projectId}/${flowId}`),

  // Create flow
  create: (projectId: string, data: any) =>
    apiRequest(`/visudev-appflow/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update flow
  update: (projectId: string, flowId: string, data: any) =>
    apiRequest(`/visudev-appflow/${projectId}/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete flow
  delete: (projectId: string, flowId: string) =>
    apiRequest(`/visudev-appflow/${projectId}/${flowId}`, {
      method: 'DELETE',
    }),
};

// ==================== BLUEPRINT ====================

export const blueprintAPI = {
  // Get blueprint for project
  get: (projectId: string) => apiRequest(`/visudev-blueprint/${projectId}`),

  // Update blueprint
  update: (projectId: string, data: any) =>
    apiRequest(`/visudev-blueprint/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete blueprint
  delete: (projectId: string) =>
    apiRequest(`/visudev-blueprint/${projectId}`, {
      method: 'DELETE',
    }),
};

// ==================== DATA ====================

export const dataAPI = {
  // Schema
  getSchema: (projectId: string) =>
    apiRequest(`/visudev-data/${projectId}/schema`),

  updateSchema: (projectId: string, data: any) =>
    apiRequest(`/visudev-data/${projectId}/schema`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Migrations
  getMigrations: (projectId: string) =>
    apiRequest(`/visudev-data/${projectId}/migrations`),

  updateMigrations: (projectId: string, data: any) =>
    apiRequest(`/visudev-data/${projectId}/migrations`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // ERD
  getERD: (projectId: string) =>
    apiRequest(`/visudev-data/${projectId}/erd`),

  updateERD: (projectId: string, data: any) =>
    apiRequest(`/visudev-data/${projectId}/erd`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==================== LOGS ====================

export const logsAPI = {
  // Get all logs for project
  getAll: (projectId: string) => apiRequest(`/visudev-logs/${projectId}`),

  // Get single log
  get: (projectId: string, logId: string) =>
    apiRequest(`/visudev-logs/${projectId}/${logId}`),

  // Create log entry
  create: (projectId: string, data: any) =>
    apiRequest(`/visudev-logs/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Delete all logs for project
  deleteAll: (projectId: string) =>
    apiRequest(`/visudev-logs/${projectId}`, {
      method: 'DELETE',
    }),

  // Delete single log
  delete: (projectId: string, logId: string) =>
    apiRequest(`/visudev-logs/${projectId}/${logId}`, {
      method: 'DELETE',
    }),
};

// ==================== ACCOUNT ====================

export const accountAPI = {
  // Get account settings
  get: (userId: string) => apiRequest(`/visudev-account/${userId}`),

  // Update account settings
  update: (userId: string, data: any) =>
    apiRequest(`/visudev-account/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get preferences
  getPreferences: (userId: string) =>
    apiRequest(`/visudev-account/${userId}/preferences`),

  // Update preferences
  updatePreferences: (userId: string, data: any) =>
    apiRequest(`/visudev-account/${userId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==================== INTEGRATIONS ====================

export const integrationsAPI = {
  // Get all integrations
  get: (projectId: string) => apiRequest(`/visudev-integrations/${projectId}`),

  // Update integrations
  update: (projectId: string, data: any) =>
    apiRequest(`/visudev-integrations/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // GitHub
  github: {
    // Connect GitHub
    connect: (projectId: string, token: string, username?: string) =>
      apiRequest(`/visudev-integrations/${projectId}/github`, {
        method: 'POST',
        body: JSON.stringify({ token, username }),
      }),

    // Get repositories
    getRepos: (projectId: string) =>
      apiRequest(`/visudev-integrations/${projectId}/github/repos`),

    // Get branches
    getBranches: (projectId: string, owner: string, repo: string) =>
      apiRequest(
        `/visudev-integrations/${projectId}/github/branches?owner=${owner}&repo=${repo}`
      ),

    // Get file/directory content
    getContent: (
      projectId: string,
      owner: string,
      repo: string,
      path: string = '',
      ref: string = 'main'
    ) =>
      apiRequest(
        `/visudev-integrations/${projectId}/github/content?owner=${owner}&repo=${repo}&path=${path}&ref=${ref}`
      ),

    // Disconnect GitHub
    disconnect: (projectId: string) =>
      apiRequest(`/visudev-integrations/${projectId}/github`, {
        method: 'DELETE',
      }),
  },

  // Supabase
  supabase: {
    // Connect Supabase
    connect: (
      projectId: string,
      url: string,
      anonKey: string,
      serviceKey?: string,
      projectRef?: string
    ) =>
      apiRequest(`/visudev-integrations/${projectId}/supabase`, {
        method: 'POST',
        body: JSON.stringify({ url, anonKey, serviceKey, projectRef }),
      }),

    // Get Supabase info
    getInfo: (projectId: string) =>
      apiRequest(`/visudev-integrations/${projectId}/supabase`),

    // Disconnect Supabase
    disconnect: (projectId: string) =>
      apiRequest(`/visudev-integrations/${projectId}/supabase`, {
        method: 'DELETE',
      }),
  },
};

// Export all APIs
export const api = {
  projects: projectsAPI,
  appflow: appflowAPI,
  blueprint: blueprintAPI,
  data: dataAPI,
  logs: logsAPI,
  account: accountAPI,
  integrations: integrationsAPI,
};
