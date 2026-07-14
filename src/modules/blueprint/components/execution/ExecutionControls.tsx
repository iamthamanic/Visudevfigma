/**
 * Sidebar controls for ExecutionView — route/path selection and step evidence.
 */

import type { SoftwareGraphEvidence, SoftwareGraphNodeKind } from "../../types";
import styles from "../../styles/ExecutionView.module.css";

const STEP_KIND_LABELS: Partial<Record<SoftwareGraphNodeKind, string>> = {
  route: "Route",
  file: "Handler",
  service: "Service",
  repository: "Repository",
  table: "Database",
  external: "External",
};

export interface ExecutionControlsProps {
  routes: { routeId: string; label: string }[];
  selectedRouteId: string | null;
  stepNodeIds: string[];
  stepLabels: Map<string, string>;
  stepKinds: Map<string, SoftwareGraphNodeKind>;
  selectedStepId: string | null;
  selectedEvidence: SoftwareGraphEvidence[];
  cycleNodeId: string | null;
  onSelectRoute: (routeId: string) => void;
  onSelectStep: (nodeId: string) => void;
}

export function ExecutionControls({
  routes,
  selectedRouteId,
  stepNodeIds,
  stepLabels,
  stepKinds,
  selectedStepId,
  selectedEvidence,
  cycleNodeId,
  onSelectRoute,
  onSelectStep,
}: ExecutionControlsProps) {
  return (
    <aside className={styles.sidebar} aria-label="Execution-Steuerung">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Route</h3>
        {routes.length === 0 ? (
          <p className={styles.emptyControls}>Keine Routen im Graph vorhanden.</p>
        ) : (
          <select
            className={styles.select}
            value={selectedRouteId ?? ""}
            onChange={(event) => onSelectRoute(event.target.value)}
          >
            {routes.map((route) => (
              <option key={route.routeId} value={route.routeId}>
                {route.label}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Pipeline-Schritte</h3>
        {stepNodeIds.length === 0 ? (
          <p className={styles.emptyControls}>Keine Ausführungsschritte für diese Route.</p>
        ) : (
          <ul className={styles.stepList}>
            {stepNodeIds.map((nodeId) => {
              const kind = stepKinds.get(nodeId) ?? "file";
              const chip = STEP_KIND_LABELS[kind] ?? kind;
              const isCycle = cycleNodeId === nodeId;
              return (
                <li key={nodeId}>
                  <button
                    type="button"
                    className={`${styles.stepButton} ${selectedStepId === nodeId ? styles.stepButtonActive : ""}`}
                    onClick={() => onSelectStep(nodeId)}
                  >
                    <span className={styles.stepChip}>{chip}</span>
                    <span className={styles.stepLabel}>{stepLabels.get(nodeId) ?? nodeId}</span>
                    {isCycle ? <span className={styles.cycleBadge}>Zyklus</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Evidence</h3>
        {!selectedStepId ? (
          <p className={styles.emptyControls}>Schritt auswählen, um Evidence zu sehen.</p>
        ) : selectedEvidence.length === 0 ? (
          <p className={styles.emptyControls}>Keine Evidence für diesen Schritt.</p>
        ) : (
          <ul className={styles.evidenceList}>
            {selectedEvidence.map((evidence) => (
              <li key={evidence.id} className={styles.evidenceItem}>
                <p className={styles.evidenceMeta}>
                  {evidence.filePath}:{evidence.line} · {evidence.kind}
                </p>
                <pre className={styles.evidenceExcerpt}>{evidence.excerpt}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
