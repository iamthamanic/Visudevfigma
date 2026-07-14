/**
 * AtlasStatsBar — cluster/node/edge counters above the atlas canvas.
 */

import styles from "../../styles/AtlasView.module.css";

export interface AtlasStatsBarProps {
  clusterCount: number;
  nodeCount: number;
  edgeCount: number;
}

export function AtlasStatsBar({
  clusterCount,
  nodeCount,
  edgeCount,
}: AtlasStatsBarProps): JSX.Element {
  return (
    <div className={styles.statsBar} aria-label="Atlas-Statistik">
      <span>{clusterCount} Cluster</span>
      <span className={styles.statsDivider} aria-hidden="true">
        ·
      </span>
      <span>{nodeCount} Module</span>
      <span className={styles.statsDivider} aria-hidden="true">
        ·
      </span>
      <span>{edgeCount} Kanten</span>
    </div>
  );
}
