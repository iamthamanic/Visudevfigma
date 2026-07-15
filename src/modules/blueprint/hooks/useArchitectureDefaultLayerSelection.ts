/**
 * Applies default Application-layer selection when the architecture graph reloads.
 */

import { useEffect } from "react";
import type { SoftwareGraph } from "../types";
import { resolveDefaultLayerId } from "../services/resolve-default-layer.js";

export function useArchitectureDefaultLayerSelection(
  graph: SoftwareGraph | null | undefined,
  groupingMode: string,
  setSelectedNodeId: (nodeId: string | null) => void,
  graphSnapshotKey: string,
): void {
  useEffect(() => {
    if (groupingMode !== "layers") return;
    setSelectedNodeId(resolveDefaultLayerId(graph));
  }, [graph, graphSnapshotKey, groupingMode, setSelectedNodeId]);
}
