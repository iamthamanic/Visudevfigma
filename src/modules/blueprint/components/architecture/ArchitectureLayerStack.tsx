/**
 * Vertical stack cards with accent borders and included-service pills (Figma layer stack).
 */

import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import type { ArchitectureStackCard } from "./build-layer-stack.js";
import styles from "../../styles/ArchitectureView.module.css";

interface ArchitectureLayerStackProps {
  cards: ArchitectureStackCard[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function ArchitectureLayerStack({
  cards,
  selectedNodeId,
  onSelectNode,
}: ArchitectureLayerStackProps): JSX.Element {
  return (
    <div className={styles.stackPanel} aria-label="Architektur-Stack">
      <ViewSectionTitle>Layer Stack</ViewSectionTitle>
      {cards.length === 0 ? (
        <p className={styles.emptyControls}>Keine Einträge für diese Gruppierung.</p>
      ) : (
        <ul className={styles.stackList}>
          {cards.map((card) => {
            const isSelected = card.id === selectedNodeId;
            return (
              <li key={card.id}>
                <button
                  type="button"
                  className={`${styles.layerCard} ${isSelected ? styles.layerCardSelected : ""}`}
                  data-kind={card.kind}
                  aria-pressed={isSelected}
                  onClick={() => onSelectNode(card.id)}
                >
                  <span className={styles.layerCardTitle}>{card.label}</span>
                  {card.services.length > 0 ? (
                    <span className={styles.servicePills}>
                      {card.services.slice(0, 4).map((service) => (
                        <span key={service} className={styles.servicePill}>
                          {service}
                        </span>
                      ))}
                      {card.services.length > 4 ? (
                        <span className={styles.servicePill}>+{card.services.length - 4}</span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
