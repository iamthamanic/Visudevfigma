/**
 * VisuDEV API client interface for local and supabase modes.
 * Location: src/lib/visudev-api/client.ts
 */

import type { Project } from "../visudev/types";
import type {
  AnalyzeProjectRequest,
  BrowseLocalPathInput,
  BrowseLocalPathResult,
  CreateProjectInput,
  LocalAppflowLatest,
  LocalBlueprintLatest,
  LocalEngineAnalysisResult,
  PreviewStartResult,
  PreviewStatusResult,
  PreviewStopResult,
  StartAnalysisResponse,
  StartPreviewInput,
  UpdateProjectInput,
  VisuDevCapabilities,
  VisuDevHealth,
  VisuDevMode,
  AnalysisRunStatus,
} from "./types";

export interface VisuDevApiClient {
  getMode(): VisuDevMode;
  getHealth(): Promise<VisuDevHealth>;
  getCapabilities(): Promise<VisuDevCapabilities>;

  listProjects(): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  updateProject(projectId: string, input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;

  startAnalysis(projectId: string, input: AnalyzeProjectRequest): Promise<StartAnalysisResponse>;
  getAnalysisStatus(projectId: string, runId: string): Promise<AnalysisRunStatus>;
  getAnalysisResult(projectId: string, runId: string): Promise<LocalEngineAnalysisResult>;
  getBlueprintLatest(projectId: string): Promise<LocalBlueprintLatest | null>;
  getAppflowLatest(projectId: string): Promise<LocalAppflowLatest | null>;

  startPreview(projectId: string, input?: StartPreviewInput): Promise<PreviewStartResult>;
  getPreviewStatus(projectId: string): Promise<PreviewStatusResult>;
  stopPreview(projectId: string): Promise<PreviewStopResult>;

  browseLocalPath(input?: BrowseLocalPathInput): Promise<BrowseLocalPathResult>;
}
