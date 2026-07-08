/**
 * Preview provider interface for Local Engine.
 * Location: local-engine/src/providers/preview-provider.ts
 */

import type {
  LocalVisuDevProject,
  PreviewStartResult,
  PreviewStatusResult,
  PreviewStopResult,
  StartPreviewInput,
} from "../types/api.types.js";

export interface PreviewProvider {
  id: string;
  name: string;
  startPreview(input: StartPreviewInput, project: LocalVisuDevProject): Promise<PreviewStartResult>;
  getPreviewStatus(projectId: string): Promise<PreviewStatusResult>;
  stopPreview(projectId: string): Promise<PreviewStopResult>;
}
