/**
 * Visible vs total node/edge counters for the dependencies graph.
 */

import styles from "../../styles/DependenciesView.module.css";

export interface DependenciesGraphFooterProps {
  visibleNodes: number;
  totalNodes: number;
  visibleEdges: number;
  totalEdges: number;
}

export function DependenciesGraphFooter({
  visibleNodes,
  totalNodes,
  visibleEdges,
  totalEdges,
}: DependenciesGraphFooterProps): JSX.Element {
  return (
    <footer className={styles.graphFooter} aria-label="Graph-Statistik">
      <span>
        {visibleNodes}/{totalNodes} Knoten sichtbar
      </span>
      <span className={styles.footerDivider} aria-hidden="true">
        ·
      </span>
      <span>
        {visibleEdges}/{totalEdges} Kanten sichtbar
      </span>
    </footer>
  );
}
