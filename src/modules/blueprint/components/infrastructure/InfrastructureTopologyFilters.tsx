/**
 * Env/region/view filters and refresh control for infrastructure topology.
 */

import { RefreshCw } from "lucide-react";
import {
  TOPOLOGY_ENV_FILTERS,
  TOPOLOGY_REGION_FILTERS,
  TOPOLOGY_VIEW_FILTERS,
  type TopologyEnvFilter,
  type TopologyRegionFilter,
  type TopologyViewFilter,
} from "./build-topology.js";
import styles from "../../styles/InfrastructureView.module.css";

interface InfrastructureTopologyFiltersProps {
  activeEnv: TopologyEnvFilter | null;
  activeRegion: TopologyRegionFilter | null;
  activeView: TopologyViewFilter | null;
  onSelectEnv: (env: TopologyEnvFilter | null) => void;
  onSelectRegion: (region: TopologyRegionFilter | null) => void;
  onSelectView: (view: TopologyViewFilter | null) => void;
  onRefresh: () => void;
}

export function InfrastructureTopologyFilters({
  activeEnv,
  activeRegion,
  activeView,
  onSelectEnv,
  onSelectRegion,
  onSelectView,
  onRefresh,
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
              {env === "Produktion" ? (
                <>
                  <span className={styles.filterStatusDot} aria-hidden="true" />
                  {env}
                </>
              ) : (
                env
              )}
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
              {region === "eu-central-1" ? (
                <span className={styles.filterChipHint}>Frankfurt</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Ansicht</span>
        <div className={styles.filterChips}>
          {TOPOLOGY_VIEW_FILTERS.map((view) => (
            <button
              key={view}
              type="button"
              className={`${styles.filterChip} ${activeView === view ? styles.filterChipActive : ""}`}
              aria-pressed={activeView === view}
              onClick={() => onSelectView(activeView === view ? null : view)}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className={styles.refreshButton} onClick={onRefresh}>
        <RefreshCw size={14} aria-hidden="true" />
        Aktualisieren
      </button>
    </div>
  );
}
