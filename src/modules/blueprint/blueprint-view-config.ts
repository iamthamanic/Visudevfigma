/**
 * Blueprint shell view ids, German labels, and URL helpers (#86).
 * Location: src/modules/blueprint/
 */

export type BlueprintShellViewId =
  | "atlas"
  | "architecture"
  | "dependencies"
  | "execution"
  | "infrastructure"
  | "diagnostics"
  | "evolution";

export interface BlueprintViewDefinition {
  id: BlueprintShellViewId;
  label: string;
}

/** Figma sidebar order with German labels. */
export const BLUEPRINT_VIEWS: readonly BlueprintViewDefinition[] = [
  { id: "atlas", label: "Atlas" },
  { id: "architecture", label: "Architektur" },
  { id: "dependencies", label: "Abhängigkeiten" },
  { id: "execution", label: "Ausführung" },
  { id: "infrastructure", label: "Infrastruktur" },
  { id: "diagnostics", label: "Diagnosen" },
  { id: "evolution", label: "Evolution" },
] as const;

const VIEW_IDS = new Set(BLUEPRINT_VIEWS.map((view) => view.id));

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "diagnostics";
}

export function isBlueprintShellViewId(
  value: string | null | undefined,
): value is BlueprintShellViewId {
  return typeof value === "string" && VIEW_IDS.has(value as BlueprintShellViewId);
}

export function parseBlueprintViewParam(value: string | null | undefined): BlueprintShellViewId {
  if (isBlueprintShellViewId(value)) return value;
  return getDefaultBlueprintView();
}

export function getBlueprintViewLabel(viewId: BlueprintShellViewId): string {
  return BLUEPRINT_VIEWS.find((view) => view.id === viewId)?.label ?? viewId;
}

export function blueprintViewSearchParam(viewId: BlueprintShellViewId): string {
  return `view=${viewId}`;
}
