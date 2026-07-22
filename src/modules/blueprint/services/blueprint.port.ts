/**
 * Port contract so blueprint domain code depends on behavior, not the legacy facade.
 */
import type { BlueprintData, BlueprintUpdateInput } from "../types";

export type BlueprintServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type BlueprintApiPort = {
  get: (projectId: string) => Promise<BlueprintServiceResult<BlueprintData>>;
  update: (
    projectId: string,
    updateInput: BlueprintUpdateInput,
  ) => Promise<BlueprintServiceResult<unknown>>;
};
