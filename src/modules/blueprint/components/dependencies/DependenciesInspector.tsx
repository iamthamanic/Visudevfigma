/**
 * Right-hand Inspektor for DependenciesView — selected edge details and evidence.
 */

import type { SoftwareGraph, SoftwareGraphEdge, SoftwareGraphEvidence } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import type { DependencyKindCount } from "./_projection.js";
import { RELATIONSHIP_LABELS, type DependencyEdgeKind } from "./_projection.constants.js";
import styles from "../../styles/DependenciesView.module.css";

export interface DependenciesInspectorProps {
  graph: SoftwareGraph;
  topDependencies: DependencyKindCount[];
  selectedEdge: SoftwareGraphEdge | null;
  selectedEvidence: SoftwareGraphEvidence[];
}

function isDependencyKind(kind: string): kind is DependencyEdgeKind {
  return kind in RELATIONSHIP_LABELS;
}

function resolveNodeLabel(graph: SoftwareGraph, nodeId: string): string {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  return node?.label ?? nodeId;
}

export function DependenciesInspector({
  graph,
  topDependencies,
  selectedEdge,
  selectedEvidence,
}: DependenciesInspectorProps): JSX.Element {
  if (!selectedEdge) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle eine Kante im Graph, um Details und Evidence zu sehen."
        sections={[
          {
            id: "top-deps",
            title: "Top Abhängigkeiten",
            content:
              topDependencies.length === 0 ? (
                <p className={styles.emptyControls}>Keine Kanten im Graph.</p>
              ) : (
                <ul className={styles.topDepsList}>
                  {topDependencies.map((dependencyCount) => (
                    <li key={dependencyCount.kind} className={styles.topDepsItem}>
                      <span className={styles.topDepsKind} data-kind={dependencyCount.kind}>
                        {RELATIONSHIP_LABELS[dependencyCount.kind]}
                      </span>
                      <span className={styles.topDepsCount}>{dependencyCount.count}</span>
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
    );
  }

  const sourceLabel = resolveNodeLabel(graph, selectedEdge.sourceId);
  const targetLabel = resolveNodeLabel(graph, selectedEdge.targetId);
  const kind = selectedEdge.kind;
  const showBadge = isDependencyKind(kind);

  return (
    <InspectorPanel
      title={`${sourceLabel} → ${targetLabel}`}
      subtitle={showBadge ? RELATIONSHIP_LABELS[kind] : kind}
      badges={
        showBadge ? (
          <span className={styles.kindBadge} data-kind={kind}>
            {RELATIONSHIP_LABELS[kind]}
          </span>
        ) : null
      }
      sections={[
        {
          id: "edge-meta",
          title: "Kante",
          content: (
            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>Quelle</dt>
                <dd>{sourceLabel}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Ziel</dt>
                <dd>{targetLabel}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>Typ</dt>
                <dd>{showBadge ? RELATIONSHIP_LABELS[kind] : kind}</dd>
              </div>
            </dl>
          ),
        },
        {
          id: "evidence",
          title: "Evidence",
          content:
            selectedEvidence.length === 0 ? (
              <p className={styles.emptyControls}>Keine Evidence für diese Kante.</p>
            ) : (
              <ul className={styles.evidenceList}>
                {selectedEvidence.map((item) => (
                  <li key={item.id} className={styles.evidenceItem}>
                    <p className={styles.evidenceMeta}>
                      {item.filePath}:{item.line} · {item.kind}
                    </p>
                    <pre className={styles.evidenceExcerpt}>{item.excerpt}</pre>
                  </li>
                ))}
              </ul>
            ),
        },
      ]}
    />
  );
}
