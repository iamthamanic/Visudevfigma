/**
 * Sidebar controls for AtlasView — search, condensed banner, clusters, node cards.
 */

import type { SoftwareGraphGroup } from "../../types";
import { AtlasClusterChips } from "./AtlasClusterChips.js";
import { AtlasNodeList } from "./AtlasNodeList.js";
import type { GraphCanvasNode } from "../../types";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasControlsProps {
  searchQuery: string;
  totalNodes: number;
  visibleNodes: number;
  condensed: boolean;
  nodes: GraphCanvasNode[];
  groups: SoftwareGraphGroup[];
  selectedNodeId: string | null;
  selectedGroupId: string | null;
  onSearchChange: (value: string) => void;
  onResetSearch: () => void;
  onSelectNode: (nodeId: string) => void;
  onSelectGroup: (groupId: string) => void;
}

export function AtlasControls({
  searchQuery,
  totalNodes,
  visibleNodes,
  condensed,
  nodes,
  groups,
  selectedNodeId,
  selectedGroupId,
  onSearchChange,
  onResetSearch,
  onSelectNode,
  onSelectGroup,
}: AtlasControlsProps): JSX.Element {
  return (
    <aside className={styles.controls} aria-label="Atlas-Steuerung">
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

      <p className={styles.modeHint}>2D-Dichtekarte — 3D-Stadtmodus folgt separat (#94).</p>
    </aside>
  );
}
