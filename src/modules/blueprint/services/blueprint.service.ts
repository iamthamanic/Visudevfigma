/**
 * Why: orchestrate blueprint get/update through an explicit port after validation.
 */
import type { BlueprintData, BlueprintUpdateInput } from "../types";
import type { BlueprintApiPort, BlueprintServiceResult } from "./blueprint.port";
import { normalizeProjectId, validateBlueprintUpdateInput } from "./blueprint.validation";

export type { BlueprintApiPort, BlueprintServiceResult } from "./blueprint.port";
export { normalizeProjectId, validateBlueprintUpdateInput } from "./blueprint.validation";

export async function fetchBlueprint(
  projectId: string,
  port: BlueprintApiPort,
): Promise<BlueprintServiceResult<BlueprintData>> {
  const resolvedId = normalizeProjectId(projectId);
  if (!resolvedId) return { success: false, error: "No project ID" };
  return port.get(resolvedId);
}

export async function saveBlueprint(
  projectId: string,
  updateInput: BlueprintUpdateInput,
  port: BlueprintApiPort,
): Promise<BlueprintServiceResult<unknown>> {
  const resolvedId = normalizeProjectId(projectId);
  if (!resolvedId) return { success: false, error: "No project ID" };
  const validatedUpdate = validateBlueprintUpdateInput(updateInput);
  if (!validatedUpdate.success || !validatedUpdate.data) {
    return { success: false, error: validatedUpdate.error };
  }
  return port.update(resolvedId, validatedUpdate.data);
}
