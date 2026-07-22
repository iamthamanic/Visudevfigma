/**
 * Why this file exists: keep utils/api coupling in one adapter so the domain
 * service stays portable and testable without mocking the facade.
 */
import { api } from "../../../utils/api";
import { logBlueprintAdapterFailure } from "./blueprint.errors";
import type { BlueprintApiPort, BlueprintServiceResult } from "./blueprint.port";

async function wrap<T>(
  operationName: string,
  operation: () => Promise<BlueprintServiceResult<T>>,
  fallbackError: string,
): Promise<BlueprintServiceResult<T>> {
  try {
    return await operation();
  } catch (cause) {
    logBlueprintAdapterFailure(operationName, cause);
    return { success: false, error: fallbackError };
  }
}

export const blueprintApiAdapter: BlueprintApiPort = {
  get: (projectId) =>
    wrap("getBlueprint", () => api.blueprint.get(projectId), "Failed to fetch blueprint"),
  update: (projectId, updateInput) =>
    wrap(
      "updateBlueprint",
      () => api.blueprint.update(projectId, updateInput),
      "Failed to update blueprint",
    ),
};
