export type BlueprintShellViewId =
  | "infrastructure"
  | "architecture"
  | "dependencies"
  | "diagnostics";

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "infrastructure";
}
