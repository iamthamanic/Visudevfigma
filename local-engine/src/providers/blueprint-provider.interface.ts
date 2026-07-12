/**
 * Narrow blueprint-provider contract for VisuDEV's pluggable analysis engine.
 * Providers return a raw scan; `BlueprintEnrichmentService` turns it into a
 * canonical `BlueprintDocument`.
 * Location: local-engine/src/providers/blueprint-provider.interface.ts
 */

import type {
  AnalyzeProjectRequest,
  BlueprintAnalysisProviderId,
  LocalVisuDevProject,
  RawBlueprintScan,
} from "../types/api.types.js";

export type BlueprintProviderInput = AnalyzeProjectRequest & {
  projectId: string;
  project: LocalVisuDevProject;
};

export interface BlueprintProvider {
  readonly id: BlueprintAnalysisProviderId;
  readonly name: string;
  scanProject(input: BlueprintProviderInput): Promise<RawBlueprintScan>;
}
