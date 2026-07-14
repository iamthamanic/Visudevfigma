/**
 * Scrollable list of visible Atlas nodes as selectable floating cards.
 */

import type { GraphCanvasNode } from "../../types";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import { AtlasNodeCard } from "./AtlasNodeCard.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasNodeListProps {
  nodes: GraphCanvasNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function AtlasNodeList({
  nodes,
  selectedNodeId,
  onSelectNode,
}: AtlasNodeListProps): JSX.Element {
  return (
    <section className={styles.nodeListSection} aria-label="Sichtbare Knoten">
      <ViewSectionTitle>Knoten</ViewSectionTitle>
      {nodes.length === 0 ? (
        <p className={styles.emptyControls}>Keine Knoten für die aktuelle Filterung.</p>
      ) : (
        <div className={styles.nodeList}>
          {nodes.map((node) => (
            <AtlasNodeCard
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              onSelect={() => onSelectNode(node.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
