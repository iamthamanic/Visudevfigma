/**
 * Compares two SoftwareGraph snapshots into diff metadata for EvolutionView.
 */

import type { SoftwareGraph, SoftwareGraphDiffMetadata, SoftwareGraphSnapshot } from "../../types";

const MAX_DIFF_IDS = 500;

export function findSnapshot(
  graph: SoftwareGraph,
  snapshotId: string,
): SoftwareGraphSnapshot | undefined {
  const snapshots = Array.isArray(graph.snapshots) ? graph.snapshots : [];
  return snapshots.find((snapshot) => snapshot.id === snapshotId);
}

function readSignature(snapshot: SoftwareGraphSnapshot, nodeId: string): string | undefined {
  return snapshot.nodeSignatures?.[nodeId];
}

export function diffSnapshots(
  _graph: SoftwareGraph,
  baseSnapshot: SoftwareGraphSnapshot,
  targetSnapshot: SoftwareGraphSnapshot,
): SoftwareGraphDiffMetadata {
  const baseIds = new Set(baseSnapshot.nodeIds);
  const targetIds = new Set(targetSnapshot.nodeIds);

  const addedNodeIds: string[] = [];
  const removedNodeIds: string[] = [];
  const changedNodeIds: string[] = [];

  for (const nodeId of targetIds) {
    if (!baseIds.has(nodeId)) {
      addedNodeIds.push(nodeId);
      continue;
    }
    const baseSig = readSignature(baseSnapshot, nodeId);
    const targetSig = readSignature(targetSnapshot, nodeId);
    if (baseSig && targetSig && baseSig !== targetSig) changedNodeIds.push(nodeId);
  }

  for (const nodeId of baseIds) {
    if (!targetIds.has(nodeId)) removedNodeIds.push(nodeId);
  }

  const totalChanges = addedNodeIds.length + removedNodeIds.length + changedNodeIds.length;
  const condensed = totalChanges > MAX_DIFF_IDS;

  return {
    baseSnapshotId: baseSnapshot.id,
    targetSnapshotId: targetSnapshot.id,
    addedNodeIds: condensed ? addedNodeIds.slice(0, MAX_DIFF_IDS) : addedNodeIds,
    removedNodeIds: condensed ? removedNodeIds.slice(0, MAX_DIFF_IDS) : removedNodeIds,
    changedNodeIds: condensed ? changedNodeIds.slice(0, MAX_DIFF_IDS) : changedNodeIds,
    identical: totalChanges === 0,
    condensed,
  };
}

export type EvolutionNodeChange = "added" | "removed" | "changed" | "unchanged";

export function resolveNodeChange(
  nodeId: string,
  diff: SoftwareGraphDiffMetadata,
): EvolutionNodeChange {
  if (diff.addedNodeIds.includes(nodeId)) return "added";
  if (diff.removedNodeIds.includes(nodeId)) return "removed";
  if (diff.changedNodeIds.includes(nodeId)) return "changed";
  return "unchanged";
}

export const EVOLUTION_CHANGE_COLORS: Record<EvolutionNodeChange, string> = {
  added: "var(--color-success)",
  removed: "var(--color-destructive)",
  changed: "var(--color-warning)",
  unchanged: "var(--color-muted-foreground)",
};
