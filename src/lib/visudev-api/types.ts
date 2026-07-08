/**
 * Shared VisuDEV API types (re-export from shared/).
 * Location: src/lib/visudev-api/types.ts
 */

export type {
  AnalysisRunStatus,
  AnalysisStatus,
  AnalyzeProjectRequest,
  ApiFailure,
  ApiResponse,
  ApiSuccess,
  BlueprintDocument,
  BrowseLocalPathInput,
  BrowseLocalPathResult,
  CreateProjectInput,
  LocalAppflowAnalysisResult,
  LocalAppflowLatest,
  LocalBlueprintAnalysisResult,
  LocalBlueprintLatest,
  LocalEngineAnalysisResult,
  LocalVisuDevProject,
  PreviewStartResult,
  PreviewStatusResult,
  PreviewStopResult,
  StartAnalysisResponse,
  StartPreviewInput,
  UpdateProjectInput,
  VisuDevCapabilities,
  VisuDevHealth,
  VisuDevMode,
} from "../../../shared/visudev-api.types";

import type { Project } from "../visudev/types";

export type LocalProjectDto = Project & { source: "local" };
