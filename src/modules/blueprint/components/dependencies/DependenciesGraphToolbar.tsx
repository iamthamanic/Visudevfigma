/**
 * Search and fullscreen controls for the dependencies graph canvas.
 */

import type { RefObject } from "react";
import styles from "../../styles/DependenciesView.module.css";

export interface DependenciesGraphToolbarProps {
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement>;
  isFullscreen: boolean;
  onSearchChange: (value: string) => void;
  onResetSearch: () => void;
  onToggleFullscreen: () => void;
}

export function DependenciesGraphToolbar({
  searchQuery,
  searchInputRef,
  isFullscreen,
  onSearchChange,
  onResetSearch,
  onToggleFullscreen,
}: DependenciesGraphToolbarProps): JSX.Element {
  return (
    <div className={styles.graphToolbar}>
      <label className={styles.searchLabel}>
        <span className={styles.searchLabelText}>Module suchen</span>
        <input
          ref={searchInputRef}
          className={styles.searchInput}
          type="search"
          value={searchQuery}
          placeholder="Label oder Modul… (⌘K)"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      {searchQuery ? (
        <button type="button" className={styles.resetButton} onClick={onResetSearch}>
          Zurücksetzen
        </button>
      ) : null}
      <button
        type="button"
        className={styles.fullscreenButton}
        onClick={onToggleFullscreen}
        aria-pressed={isFullscreen}
      >
        {isFullscreen ? "Vollbild beenden" : "Vollbild"}
      </button>
    </div>
  );
}
