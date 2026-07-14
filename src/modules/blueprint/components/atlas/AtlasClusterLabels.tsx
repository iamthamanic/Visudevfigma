/**
 * AtlasClusterLabels — floating cluster names over the atlas canvas.
 */

import type { SoftwareGraphGroup } from "../../types";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasClusterLabelsProps {
  groups: SoftwareGraphGroup[];
}

export function AtlasClusterLabels({ groups }: AtlasClusterLabelsProps): JSX.Element | null {
  if (groups.length === 0) return null;

  const preview = groups.slice(0, 8);

  return (
    <div className={styles.clusterLabels} aria-label="Cluster-Beschriftungen">
      {preview.map((group) => (
        <span key={group.id} className={styles.clusterLabel} data-kind={group.kind}>
          {group.label}
        </span>
      ))}
    </div>
  );
}
