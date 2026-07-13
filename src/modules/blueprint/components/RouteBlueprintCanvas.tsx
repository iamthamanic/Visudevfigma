/**
 * RouteBlueprintCanvas — linear pipeline per Route (Request → Gates → DB → Audit → External).
 * Location: src/modules/blueprint/components/RouteBlueprintCanvas.tsx
 */

import type { BlueprintFinding, RouteBlueprint } from "../types";
import { buildLinearPipeline } from "../services/blueprint-pipeline";
import { PipelineNodeCard } from "./PipelineNodeCard";
import { PipelineEdge } from "./PipelineEdge";
import styles from "../styles/RouteBlueprintCanvas.module.css";

interface RouteBlueprintCanvasProps {
  route: RouteBlueprint | null;
  findings: BlueprintFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string | null) => void;
}

export function RouteBlueprintCanvas({
  route,
  findings,
  selectedFindingId,
  onSelectFinding,
}: RouteBlueprintCanvasProps) {
  if (!route) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Route Blueprint</p>
        <p className={styles.emptyHint}>Wähle eine Route in der Security Matrix.</p>
      </div>
    );
  }

  const pipeline = buildLinearPipeline(route);

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
        {pipeline.map((node, index) => (
          <div key={node.id} className={styles.pipelineItem} role="listitem">
            {index > 0 && <PipelineEdge dashed={node.state === "missing"} />}
            <PipelineNodeCard
              node={node}
              findings={findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={onSelectFinding}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
