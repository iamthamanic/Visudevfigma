/**
 * Env/region filter chips for infrastructure topology (UI placeholders until graph metadata).
 */

import {
  TOPOLOGY_ENV_FILTERS,
  TOPOLOGY_REGION_FILTERS,
  type TopologyEnvFilter,
  type TopologyRegionFilter,
} from "./build-topology.js";
import styles from "../../styles/InfrastructureView.module.css";

interface InfrastructureTopologyFiltersProps {
  activeEnv: TopologyEnvFilter | null;
  activeRegion: TopologyRegionFilter | null;
  onSelectEnv: (env: TopologyEnvFilter | null) => void;
  onSelectRegion: (region: TopologyRegionFilter | null) => void;
}

export function InfrastructureTopologyFilters({
  activeEnv,
  activeRegion,
  onSelectEnv,
  onSelectRegion,
}: InfrastructureTopologyFiltersProps): JSX.Element {
  return (
    <div className={styles.filterBar} aria-label="Infrastruktur-Filter">
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Umgebung</span>
        <div className={styles.filterChips}>
          {TOPOLOGY_ENV_FILTERS.map((env) => (
            <button
              key={env}
              type="button"
              className={`${styles.filterChip} ${activeEnv === env ? styles.filterChipActive : ""}`}
              aria-pressed={activeEnv === env}
              onClick={() => onSelectEnv(activeEnv === env ? null : env)}
            >
              {env}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Region</span>
        <div className={styles.filterChips}>
          {TOPOLOGY_REGION_FILTERS.map((region) => (
            <button
              key={region}
              type="button"
              className={`${styles.filterChip} ${activeRegion === region ? styles.filterChipActive : ""}`}
              aria-pressed={activeRegion === region}
              onClick={() => onSelectRegion(activeRegion === region ? null : region)}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
