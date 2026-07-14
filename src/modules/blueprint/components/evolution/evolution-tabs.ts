/**
 * Evolution sub-tab ids for Figma Timeline / Commit Diff / Branch Compare / Working Tree.
 */

export const EVOLUTION_TABS = [
  { id: "timeline", label: "Timeline" },
  { id: "commit-diff", label: "Commit Diff" },
  { id: "branch-compare", label: "Branch Compare" },
  { id: "working-tree", label: "Working Tree" },
] as const;

export type EvolutionTabId = (typeof EVOLUTION_TABS)[number]["id"];
