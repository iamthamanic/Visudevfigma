/**
 * AtlasStatsBar — Systeme/Services/Module/Dateien/Abdeckung counters above the atlas canvas.
 */

import type { AtlasAggregateStats } from "./atlas-stats.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasStatsBarProps {
  stats: AtlasAggregateStats;
}

const STAT_ITEMS: Array<{ key: keyof AtlasAggregateStats; label: string; suffix?: string }> = [
  { key: "systems", label: "Systeme" },
  { key: "services", label: "Services" },
  { key: "modules", label: "Module" },
  { key: "files", label: "Dateien" },
  { key: "coveragePercent", label: "Abdeckung", suffix: "%" },
];

export function AtlasStatsBar({ stats }: AtlasStatsBarProps): JSX.Element {
  return (
    <div className={styles.statsBar} aria-label="Atlas-Statistik" data-testid="atlas-stats-bar">
      {STAT_ITEMS.map((item, index) => (
        <span key={item.key} className={styles.statsItem} data-testid="atlas-stat-item">
          {index > 0 ? (
            <span className={styles.statsDivider} aria-hidden="true">
              ·
            </span>
          ) : null}
          {item.label}: {stats[item.key]}
          {item.suffix ?? ""}
        </span>
      ))}
    </div>
  );
}
