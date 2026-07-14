/**
 * Inspektor sub-tab ids for AtlasView.
 */

export const ATLAS_INSPECTOR_TABS = [
  { id: "overview", label: "Übersicht" },
  { id: "details", label: "Details" },
  { id: "dependencies", label: "Abhängigkeiten" },
  { id: "deployments", label: "Deployments" },
] as const;

export type AtlasInspectorTabId = (typeof ATLAS_INSPECTOR_TABS)[number]["id"];

export const ATLAS_CLUSTER_MEMBER_LIMIT = 24;
