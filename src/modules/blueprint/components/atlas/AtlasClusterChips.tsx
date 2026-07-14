/**
 * Cluster label chips for visible SoftwareGraph groups on the Atlas map.
 */

import type { SoftwareGraphGroup } from "../../types";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import { atlasKindLabel } from "./atlas-display.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasClusterChipsProps {
  groups: SoftwareGraphGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
}

export function AtlasClusterChips({
  groups,
  selectedGroupId,
  onSelectGroup,
}: AtlasClusterChipsProps): JSX.Element | null {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className={styles.clusterSection} aria-label="Cluster">
      <ViewSectionTitle>Cluster</ViewSectionTitle>
      <div className={styles.clusterList} role="list">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            role="listitem"
            aria-label={`${group.label}, ${atlasKindLabel(group.kind)}, ${group.nodeIds.length} Knoten`}
            className={styles.clusterChip}
            data-selected={selectedGroupId === group.id ? "true" : "false"}
            data-kind={group.kind}
            aria-pressed={selectedGroupId === group.id}
            onClick={() => onSelectGroup(group.id)}
          >
            <span className={styles.clusterChipLabel}>{group.label}</span>
            <span className={styles.clusterChipMeta}>
              {atlasKindLabel(group.kind)} · {group.nodeIds.length}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
