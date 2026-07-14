export type BlueprintShellViewId =
  | "infrastructure"
  | "architecture"
  | "dependencies"
  | "execution"
  | "diagnostics";

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "infrastructure";
}
