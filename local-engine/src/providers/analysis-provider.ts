/**
 * Analysis provider interface for Local Engine.
 * Location: local-engine/src/providers/analysis-provider.ts
 */

import type {
  AnalyzeProjectRequest,
  LocalEngineAnalysisResult,
  LocalVisuDevProject,
} from "../types/api.types.js";

export type AnalyzeProjectInput = AnalyzeProjectRequest & {
  projectId: string;
  project: LocalVisuDevProject;
};

export interface AnalysisProvider {
  id: string;
  name: string;
  analyzeProject(input: AnalyzeProjectInput): Promise<LocalEngineAnalysisResult>;
}
