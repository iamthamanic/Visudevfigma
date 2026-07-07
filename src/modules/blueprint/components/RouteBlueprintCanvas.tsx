/**
 * RouteBlueprintCanvas — lineare Pipeline pro Route (Request → Gates → DB).
 * Location: src/modules/blueprint/components/RouteBlueprintCanvas.tsx
 */

import type { ConceptState, PipelineNode, RouteBlueprint } from "../types";
import styles from "../styles/RouteBlueprintCanvas.module.css";

interface RouteBlueprintCanvasProps {
  route: RouteBlueprint | null;
}

export function RouteBlueprintCanvas({ route }: RouteBlueprintCanvasProps) {
  if (!route) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Route Blueprint</p>
        <p className={styles.emptyHint}>Wähle eine Route in der Security Matrix.</p>
      </div>
    );
  }

  return (
    <section className={styles.root} aria-labelledby="route-blueprint-title">
      <header className={styles.header}>
        <h2 id="route-blueprint-title" className={styles.title}>
          {route.method} {route.path}
        </h2>
        <p className={styles.meta}>
          <code>{route.filePath}</code> · Zeile {route.line}
        </p>
      </header>
      <div className={styles.pipeline} role="list">
        {route.pipeline.map((node, index) => (
          <div key={node.id} className={styles.pipelineItem} role="listitem">
            {index > 0 && <div className={styles.edge} aria-hidden="true" />}
            <NodeCard node={node} />
          </div>
        ))}
      </div>
    </section>
  );
}

function NodeCard({ node }: { node: PipelineNode }) {
  return (
    <div className={`${styles.node} ${stateClass(node.state)}`}>
      <span className={styles.nodeLabel}>{node.label}</span>
      <span className={styles.nodeState}>{stateLabel(node.state)}</span>
    </div>
  );
}

function stateClass(state: ConceptState): string {
  if (state === "confirmed") return styles.nodeConfirmed;
  if (state === "missing" || state === "contradictory") return styles.nodeMissing;
  if (state === "partial" || state === "weak") return styles.nodePartial;
  return styles.nodeUnknown;
}

function stateLabel(state: ConceptState): string {
  const map: Record<ConceptState, string> = {
    confirmed: "Bestätigt",
    partial: "Teilweise",
    weak: "Schwach",
    missing: "Fehlt",
    unknown: "Unbekannt",
    contradictory: "Widerspruch",
  };
  return map[state] ?? state;
}
