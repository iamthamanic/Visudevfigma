import type { SoftwareGraphNodeKind } from "../../types";
import { ARCHITECTURE_NODE_KINDS } from "./_projection.js";
import styles from "../../styles/ArchitectureView.module.css";

const KIND_LABELS: Record<SoftwareGraphNodeKind, string> = {
  organization: "Organization",
  application: "Application",
  domain: "Domain",
  layer: "Layer",
  module: "Module",
  route: "Route",
  service: "Service",
  repository: "Repository",
  table: "Table",
  external: "External",
  file: "File",
  symbol: "Symbol",
  runtime: "Runtime",
};

export interface ArchitectureControlsProps {
  collapsible: { id: string; label: string; kind: "domain" | "module" }[];
  collapsedIds: Set<string>;
  visibleKinds: Set<SoftwareGraphNodeKind>;
  hasVisibleNodes: boolean;
  onToggleCollapse: (id: string) => void;
  onToggleKind: (kind: SoftwareGraphNodeKind) => void;
  onResetFilters: () => void;
}

export function ArchitectureControls({
  collapsible,
  collapsedIds,
  visibleKinds,
  hasVisibleNodes,
  onToggleCollapse,
  onToggleKind,
  onResetFilters,
}: ArchitectureControlsProps) {
  return (
    <aside className={styles.sidebar} aria-label="Architektur-Steuerung">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Einklappen</h3>
        {collapsible.length === 0 ? (
          <p className={styles.emptyControls}>Keine Domains oder Module vorhanden.</p>
        ) : (
          <ul className={styles.collapseList}>
            {collapsible.map((collapsibleGroup) => (
              <li key={collapsibleGroup.id}>
                <button
                  type="button"
                  className={styles.collapseButton}
                  aria-pressed={collapsedIds.has(collapsibleGroup.id)}
                  onClick={() => onToggleCollapse(collapsibleGroup.id)}
                >
                  <span className={styles.collapseKind}>{collapsibleGroup.kind}</span>
                  <span className={styles.collapseLabel}>{collapsibleGroup.label}</span>
                  <span className={styles.collapseState}>
                    {collapsedIds.has(collapsibleGroup.id) ? "▸" : "▾"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Knotentypen</h3>
        <div className={styles.filterGrid}>
          {ARCHITECTURE_NODE_KINDS.map((kind) => (
            <label key={kind} className={styles.filterLabel}>
              <input
                type="checkbox"
                checked={visibleKinds.has(kind)}
                onChange={() => onToggleKind(kind)}
              />
              {KIND_LABELS[kind]}
            </label>
          ))}
        </div>
      </section>

      {!hasVisibleNodes ? (
        <section className={styles.section}>
          <p className={styles.filteredEmpty}>Keine sichtbaren Knoten mit den aktuellen Filtern.</p>
          <button type="button" className={styles.resetButton} onClick={onResetFilters}>
            Filter zurücksetzen
          </button>
        </section>
      ) : null}
    </aside>
  );
}
