/**
 * Floating node label card for Atlas controls — kind-colored left border.
 */

import type { GraphCanvasNode } from "../../types";
import { atlasKindLabel } from "./atlas-display.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasNodeCardProps {
  node: GraphCanvasNode;
  selected: boolean;
  onSelect: () => void;
}

export function AtlasNodeCard({ node, selected, onSelect }: AtlasNodeCardProps): JSX.Element {
  return (
    <button
      type="button"
      className={styles.nodeCard}
      data-selected={selected ? "true" : "false"}
      data-kind={node.kind}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.nodeCardLabel}>{node.label}</span>
      <span className={styles.nodeCardMeta}>{atlasKindLabel(node.kind)}</span>
    </button>
  );
}
