/**
 * Architecture grouping modes — map Figma Domains/Layers/Modules toggle to visible node kinds.
 */

import type { SoftwareGraphNodeKind } from "../../types";
import { DEFAULT_VISIBLE_KINDS } from "./_projection.constants.js";

export const ARCHITECTURE_GROUPING_MODES = ["domains", "layers", "modules"] as const;

export type ArchitectureGroupingMode = (typeof ARCHITECTURE_GROUPING_MODES)[number];

export const GROUPING_MODE_LABELS: Record<ArchitectureGroupingMode, string> = {
  domains: "Domains",
  layers: "Layers",
  modules: "Modules",
};

export const GROUPING_VISIBLE_KINDS: Record<ArchitectureGroupingMode, SoftwareGraphNodeKind[]> = {
  domains: ["domain"],
  layers: ["domain", "layer"],
  modules: DEFAULT_VISIBLE_KINDS,
};

export const GROUPING_STACK_KIND: Record<ArchitectureGroupingMode, SoftwareGraphNodeKind> = {
  domains: "domain",
  layers: "layer",
  modules: "module",
};
