/**
 * Atlas projection limits and overview node kinds.
 */

import type { SoftwareGraphNodeKind } from "../../types";

export const ATLAS_SOFT_LIMIT = 400;
export const ATLAS_SEARCH_MATCH_LIMIT = 80;
export const ATLAS_MAX_EDGES = 800;
export const ATLAS_MAX_LABEL_LEN = 40;

export const ATLAS_OVERVIEW_KINDS = new Set<SoftwareGraphNodeKind>([
  "organization",
  "application",
  "domain",
  "module",
  "route",
  "service",
  "table",
  "external",
]);
