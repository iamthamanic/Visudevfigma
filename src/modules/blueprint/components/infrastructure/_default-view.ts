export type BlueprintShellViewId =
  | "infrastructure"
  | "architecture"
  | "dependencies"
  | "execution"
  | "evolution"
  | "diagnostics";

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "infrastructure";
}
