export type BlueprintShellViewId = "infrastructure" | "diagnostics";

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "infrastructure";
}
