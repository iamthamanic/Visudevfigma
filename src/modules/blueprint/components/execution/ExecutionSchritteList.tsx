/**
 * Numbered Schritte list for ExecutionView left column.
 */

import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import type { SoftwareGraphNodeKind } from "../../types";
import styles from "../../styles/ExecutionView.module.css";

const STEP_KIND_LABELS: Partial<Record<SoftwareGraphNodeKind, string>> = {
  route: "Route",
  file: "Handler",
  service: "Service",
  repository: "Repository",
  table: "Database",
  external: "External",
};

export interface ExecutionSchritteListProps {
  stepNodeIds: string[];
  stepLabels: Map<string, string>;
  stepKinds: Map<string, SoftwareGraphNodeKind>;
  selectedStepId: string | null;
  cycleNodeId: string | null;
  onSelectStep: (nodeId: string) => void;
}

export function ExecutionSchritteList({
  stepNodeIds,
  stepLabels,
  stepKinds,
  selectedStepId,
  cycleNodeId,
  onSelectStep,
}: ExecutionSchritteListProps): JSX.Element {
  return (
    <aside className={styles.controls} aria-label="Schritte">
      <ViewSectionTitle>Schritte</ViewSectionTitle>
      {stepNodeIds.length === 0 ? (
        <p className={styles.emptyControls}>Keine Ausführungsschritte für diese Route.</p>
      ) : (
        <ol className={styles.schritteList}>
          {stepNodeIds.map((nodeId, index) => {
            const kind = stepKinds.get(nodeId) ?? "file";
            const chip = STEP_KIND_LABELS[kind] ?? kind;
            const isCycle = cycleNodeId === nodeId;
            const isActive = selectedStepId === nodeId;

            return (
              <li key={nodeId}>
                <button
                  type="button"
                  className={`${styles.schritteButton} ${isActive ? styles.schritteButtonActive : ""}`}
                  aria-pressed={isActive}
                  onClick={() => onSelectStep(nodeId)}
                >
                  <span className={styles.schritteNumber}>{index + 1}</span>
                  <span className={styles.schritteBody}>
                    <span className={styles.schritteKind}>{chip}</span>
                    <span className={styles.schritteLabel}>{stepLabels.get(nodeId) ?? nodeId}</span>
                  </span>
                  {isCycle ? <span className={styles.cycleBadge}>Zyklus</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
