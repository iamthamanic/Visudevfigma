export type BlueprintShellViewId = "infrastructure" | "architecture" | "diagnostics";

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "infrastructure";
}
