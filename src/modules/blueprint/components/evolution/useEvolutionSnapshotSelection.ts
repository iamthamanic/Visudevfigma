/**
 * Snapshot selection state for EvolutionView compare controls.
 */

import { useEffect, useState } from "react";
import type { SoftwareGraphSnapshot } from "../../types";

export function useEvolutionSnapshotSelection(snapshots: SoftwareGraphSnapshot[]) {
  const [baseSnapshotId, setBaseSnapshotId] = useState<string | null>(null);
  const [targetSnapshotId, setTargetSnapshotId] = useState<string | null>(null);

  useEffect(() => {
    if (snapshots.length === 0) {
      setBaseSnapshotId(null);
      setTargetSnapshotId(null);
      return;
    }
    if (snapshots.length === 1) {
      setBaseSnapshotId(snapshots[0].id);
      setTargetSnapshotId(snapshots[0].id);
      return;
    }
    if (!baseSnapshotId || !snapshots.some((snapshot) => snapshot.id === baseSnapshotId)) {
      setBaseSnapshotId(snapshots[0].id);
    }
    if (!targetSnapshotId || !snapshots.some((snapshot) => snapshot.id === targetSnapshotId)) {
      setTargetSnapshotId(snapshots[snapshots.length - 1].id);
    }
  }, [snapshots, baseSnapshotId, targetSnapshotId]);

  return {
    baseSnapshotId,
    targetSnapshotId,
    setBaseSnapshotId,
    setTargetSnapshotId,
  };
}
