/**
 * Sidebar controls for AtlasView — search and condensation status.
 */

import styles from "../../styles/AtlasView.module.css";

export interface AtlasControlsProps {
  searchQuery: string;
  totalNodes: number;
  visibleNodes: number;
  condensed: boolean;
  onSearchChange: (value: string) => void;
  onResetSearch: () => void;
}

export function AtlasControls({
  searchQuery,
  totalNodes,
  visibleNodes,
  condensed,
  onSearchChange,
  onResetSearch,
}: AtlasControlsProps) {
  return (
    <aside className={styles.sidebar} aria-label="Atlas-Steuerung">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Übersicht</h3>
        <p className={styles.stat}>
          {visibleNodes} von {totalNodes} Knoten sichtbar
        </p>
        {condensed ? (
          <p className={styles.hint}>
            Große Codebasis — Atlas zeigt eine verdichtete 2D-Karte (Module, Domains, Services).
          </p>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Suche</h3>
        <label className={styles.fieldLabel}>
          Knoten filtern
          <input
            className={styles.searchInput}
            type="search"
            value={searchQuery}
            placeholder="Label durchsuchen…"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        {searchQuery ? (
          <button type="button" className={styles.resetButton} onClick={onResetSearch}>
            Suche zurücksetzen
          </button>
        ) : null}
      </section>

      <section className={styles.section}>
        <p className={styles.hint}>2D-Dichtekarte. 3D-Stadtmodus ist deaktiviert (Performance).</p>
      </section>
    </aside>
  );
}
