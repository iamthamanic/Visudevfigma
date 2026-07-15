/**
 * Resets and applies the default Atlas cluster selection on graph reload.
 */

import { useEffect, useRef } from "react";
import type { SoftwareGraph, SoftwareGraphGroup } from "../types";

export function useAtlasDefaultClusterSelection(
  graph: SoftwareGraph | null | undefined,
  visibleGroups: SoftwareGraphGroup[],
  selectedGroupId: string | null,
  selectedNodeId: string | null,
  setSelectedGroupId: (groupId: string | null) => void,
  setSelectedNodeId: (nodeId: string | null) => void,
  graphSnapshotKey: string,
): void {
  const pendingAutoSelect = useRef(true);

  useEffect(() => {
    pendingAutoSelect.current = true;
    setSelectedGroupId(null);
    setSelectedNodeId(null);
  }, [graphSnapshotKey, setSelectedGroupId, setSelectedNodeId]);

  useEffect(() => {
    if (!pendingAutoSelect.current || !graph || visibleGroups.length === 0) return;
    if (selectedGroupId || selectedNodeId) {
      pendingAutoSelect.current = false;
      return;
    }
    const preferredServiceCluster =
      visibleGroups.find((group) => /api service/i.test(group.label)) ??
      visibleGroups.find((group) => !group.id.startsWith("execution:"));
    if (preferredServiceCluster) {
      setSelectedGroupId(preferredServiceCluster.id);
      pendingAutoSelect.current = false;
    }
  }, [graph, graphSnapshotKey, visibleGroups, selectedGroupId, selectedNodeId, setSelectedGroupId]);
}
