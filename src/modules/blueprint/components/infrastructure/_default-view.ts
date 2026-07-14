export type BlueprintShellViewId =
  | "infrastructure"
  | "architecture"
  | "dependencies"
  | "execution"
  | "evolution"
  | "atlas"
  | "diagnostics";

export function getDefaultBlueprintView(): BlueprintShellViewId {
  return "infrastructure";
}
