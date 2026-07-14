/**
 * Atlas canvas view mode — 2D Cytoscape or lazy-loaded 3D city.
 */

export type AtlasViewMode = "2d" | "3d";

export const ATLAS_VIEW_MODES: { id: AtlasViewMode; label: string }[] = [
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
];
