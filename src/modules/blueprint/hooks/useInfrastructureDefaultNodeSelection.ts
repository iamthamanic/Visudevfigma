/**
 * Resets and applies the default infrastructure topology node on graph reload.
 */

import { useEffect, useRef } from "react";
import type { TopologyNodeRef } from "../components/infrastructure/build-topology.js";

export function useInfrastructureDefaultNodeSelection(
  topologyNodes: TopologyNodeRef[],
  selectedNodeId: string | null,
  setSelectedNodeId: (nodeId: string | null) => void,
  graphSnapshotKey: string,
): void {
  const pendingAutoSelect = useRef(true);

  useEffect(() => {
    pendingAutoSelect.current = true;
    setSelectedNodeId(null);
  }, [graphSnapshotKey, setSelectedNodeId]);

  useEffect(() => {
    if (!pendingAutoSelect.current || topologyNodes.length === 0) return;
    if (selectedNodeId) {
      pendingAutoSelect.current = false;
      return;
    }
    const defaultWebAppNode =
      topologyNodes.find((node) => /web app/i.test(node.label)) ?? topologyNodes[0] ?? null;
    if (defaultWebAppNode) {
      setSelectedNodeId(defaultWebAppNode.id);
      pendingAutoSelect.current = false;
    }
  }, [topologyNodes, selectedNodeId, graphSnapshotKey, setSelectedNodeId]);
}
