/**
 * Übersicht tab content for Atlas Inspektor.
 */

import type { SoftwareGraphGroup, SoftwareGraphNode } from "../../types";
import { atlasKindLabel } from "./atlas-display.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasInspectorOverviewTabProps {
  node: SoftwareGraphNode | null;
  cluster: SoftwareGraphGroup | null;
  nodeGroups: SoftwareGraphGroup[];
}

export function AtlasInspectorOverviewTab({
  node,
  cluster,
  nodeGroups,
}: AtlasInspectorOverviewTabProps): JSX.Element {
  return (
    <dl className={styles.detailList}>
      <div className={styles.detailRow}>
        <dt>Name</dt>
        <dd>{cluster?.label ?? node?.label ?? "—"}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Typ</dt>
        <dd>{atlasKindLabel(cluster?.kind ?? node?.kind ?? "—")}</dd>
      </div>
      {cluster ? (
        <div className={styles.detailRow}>
          <dt>Knoten</dt>
          <dd>{cluster.nodeIds.length}</dd>
        </div>
      ) : null}
      {node && nodeGroups.length > 0 ? (
        <div className={styles.detailRow}>
          <dt>Cluster</dt>
          <dd>{nodeGroups.map((group) => group.label).join(", ")}</dd>
        </div>
      ) : null}
    </dl>
  );
}
