/**
 * Sidebar controls for AtlasView — search, condensed banner, clusters, node cards.
 */

import type { SoftwareGraphGroup } from "../../types";
import { AtlasClusterChips } from "./AtlasClusterChips.js";
import { AtlasNodeList } from "./AtlasNodeList.js";
import { AtlasViewModeToggle } from "./AtlasViewModeToggle.js";
import type { AtlasViewMode } from "./atlas-view-mode.js";
import type { GraphCanvasNode } from "../../types";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasControlsProps {
  searchQuery: string;
  totalNodes: number;
  visibleNodes: number;
  condensed: boolean;
  viewMode: AtlasViewMode;
  threeDisabled: boolean;
  nodes: GraphCanvasNode[];
  groups: SoftwareGraphGroup[];
  selectedNodeId: string | null;
  selectedGroupId: string | null;
  onSearchChange: (value: string) => void;
  onResetSearch: () => void;
  onSelectNode: (nodeId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectViewMode: (mode: AtlasViewMode) => void;
}

export function AtlasControls({
  searchQuery,
  totalNodes,
  visibleNodes,
  condensed,
  viewMode,
  threeDisabled,
  nodes,
  groups,
  selectedNodeId,
  selectedGroupId,
  onSearchChange,
  onResetSearch,
  onSelectNode,
  onSelectGroup,
  onSelectViewMode,
}: AtlasControlsProps): JSX.Element {
  return (
    <aside className={styles.controls} aria-label="Atlas-Steuerung">
      <AtlasViewModeToggle
        mode={viewMode}
        threeDisabled={threeDisabled}
        onSelectMode={onSelectViewMode}
      />

      <div className={styles.searchBar}>
        <label className={styles.searchLabel}>
          <span className={styles.searchLabelText}>Atlas durchsuchen</span>
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
            Zurücksetzen
          </button>
        ) : null}
      </div>

      {condensed ? (
        <div className={styles.condensedBanner} role="status">
          <p className={styles.condensedBannerTitle}>Verdichtete Karte</p>
          <p className={styles.condensedBannerText}>
            Große Codebasis — Atlas zeigt Module, Domains und Services (Soft-Limit {visibleNodes}{" "}
            sichtbar).
          </p>
        </div>
      ) : null}

      <p className={styles.stat}>
        {visibleNodes} von {totalNodes} Knoten sichtbar
      </p>

      <AtlasClusterChips
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={onSelectGroup}
      />

      <AtlasNodeList nodes={nodes} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />

      {threeDisabled ? (
        <p className={styles.modeHint}>
          3D-Stadtmodus ist bei „Bewegung reduzieren“ deaktiviert — 2D bleibt voll nutzbar.
        </p>
      ) : (
        <p className={styles.modeHint}>
          Wechsle zwischen 2D-Karte und 3D-Stadt. Tastatur: 2D-Button fokussieren und Enter.
        </p>
      )}
    </aside>
  );
}
