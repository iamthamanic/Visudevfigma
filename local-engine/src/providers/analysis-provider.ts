/**
 * Analysis provider interface for non-blueprint scans (appflow, data, preview).
 * Blueprint providers use the narrower `BlueprintProvider` interface.
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

export type { BlueprintProvider, BlueprintProviderInput } from "./blueprint-provider.interface.js";
