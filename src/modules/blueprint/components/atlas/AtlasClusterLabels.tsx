/**
 * AtlasClusterLabels — floating cluster cards over the atlas canvas.
 */

import type { SoftwareGraphGroup } from "../../types";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasClusterLabelsProps {
  groups: SoftwareGraphGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
}

export function AtlasClusterLabels({
  groups,
  selectedGroupId,
  onSelectGroup,
}: AtlasClusterLabelsProps): JSX.Element | null {
  if (groups.length === 0) return null;

  const preview = groups.filter((group) => !group.id.startsWith("execution:")).slice(0, 8);
  if (preview.length === 0) return null;

  return (
    <div className={styles.clusterLabels} aria-label="Cluster-Beschriftungen">
      {preview.map((group) => {
        const isSelected = selectedGroupId === group.id;

        return (
          <button
            key={group.id}
            type="button"
            className={`${styles.clusterLabel} ${isSelected ? styles.clusterLabelSelected : ""}`}
            data-kind={group.kind}
            data-testid="atlas-cluster"
            data-selected={isSelected ? "true" : "false"}
            aria-pressed={isSelected}
            onClick={() => onSelectGroup(group.id)}
          >
            <span className={styles.clusterLabelTitle} data-testid="atlas-cluster-label">
              {group.label}
            </span>
            <span className={styles.clusterLabelMeta}>
              {group.nodeIds.length} Module · {Math.min(100, group.nodeIds.length * 12)}% Abdeckung
            </span>
          </button>
        );
      })}
    </div>
  );
}
