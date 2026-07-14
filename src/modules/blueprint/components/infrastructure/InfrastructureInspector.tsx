/**
 * Inspektor for InfrastructureView with overview, resource meters, and connections.
 */

import type { GraphCanvasEdge, GraphCanvasNode } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import { InfrastructureResourceMeters } from "./InfrastructureResourceMeters.js";
import { STATIC_PLACEHOLDER_METERS } from "./infrastructure-resource-meters.js";
import styles from "../../styles/InfrastructureView.module.css";

const KIND_LABELS: Record<string, string> = {
  runtime: "Laufzeit",
  service: "API Service",
  external: "External Service",
  table: "Datenbank",
  file: "Web App",
  route: "Route",
};

const OVERVIEW_DEFAULTS: Record<
  string,
  { port: string; instances: string; uptime: string; version: string }
> = {
  "Web App": { port: "3000", instances: "3", uptime: "99,9 %", version: "Next.js 14" },
  "API Service": { port: "4000", instances: "4", uptime: "99,8 %", version: "Node.js 20" },
  Worker: { port: "4001", instances: "2", uptime: "99,7 %", version: "BullMQ" },
  "Auth Service": { port: "4002", instances: "2", uptime: "99,9 %", version: "Node.js 20" },
};

function overviewForNode(node: GraphCanvasNode) {
  return (
    OVERVIEW_DEFAULTS[node.label] ?? {
      port: "—",
      instances: "1",
      uptime: "99,5 %",
      version: "—",
    }
  );
}

function connectionLabels(
  nodeId: string,
  edges: GraphCanvasEdge[],
  nodes: GraphCanvasNode[],
): { incoming: string[]; outgoing: string[] } {
  const labelById = new Map(nodes.map((node) => [node.id, node.label]));
  const incoming = edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => labelById.get(edge.source) ?? edge.source);
  const outgoing = edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => labelById.get(edge.target) ?? edge.target);
  return { incoming, outgoing };
}

export interface InfrastructureInspectorProps {
  node: GraphCanvasNode | null;
  edges?: GraphCanvasEdge[];
  nodes?: GraphCanvasNode[];
}

export function InfrastructureInspector({
  node,
  edges = [],
  nodes = [],
}: InfrastructureInspectorProps): JSX.Element {
  if (!node) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Service, um Status und Ressourcen zu sehen."
      />
    );
  }

  const kindLabel = KIND_LABELS[node.kind] ?? node.kind;
  const overview = overviewForNode(node);
  const connections = connectionLabels(node.id, edges, nodes);

  return (
    <InspectorPanel
      title={node.label}
      subtitle={kindLabel}
      badges={<StatusBadge variant="running" label="RUNNING" />}
      sections={[
        {
          id: "overview",
          title: "Übersicht",
          content: (
            <dl className={styles.overviewList}>
              <div className={styles.overviewRow}>
                <dt>Port</dt>
                <dd>{overview.port}</dd>
              </div>
              <div className={styles.overviewRow}>
                <dt>Instanzen</dt>
                <dd>{overview.instances}</dd>
              </div>
              <div className={styles.overviewRow}>
                <dt>Uptime</dt>
                <dd>{overview.uptime}</dd>
              </div>
              <div className={styles.overviewRow}>
                <dt>Version</dt>
                <dd>{overview.version}</dd>
              </div>
            </dl>
          ),
        },
        {
          id: "resources",
          title: "Ressourcen",
          content: <InfrastructureResourceMeters values={STATIC_PLACEHOLDER_METERS} />,
        },
        {
          id: "connections",
          title: "Verbindungen",
          content: (
            <div className={styles.connectionGroups}>
              <div>
                <p className={styles.connectionHeading}>Eingehend</p>
                {connections.incoming.length > 0 ? (
                  <ul className={styles.connectionList}>
                    {connections.incoming.map((label) => (
                      <li key={`in-${label}`}>{label}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyControls}>Keine eingehenden Verbindungen.</p>
                )}
              </div>
              <div>
                <p className={styles.connectionHeading}>Ausgehend</p>
                {connections.outgoing.length > 0 ? (
                  <ul className={styles.connectionList}>
                    {connections.outgoing.map((label) => (
                      <li key={`out-${label}`}>{label}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyControls}>Keine ausgehenden Verbindungen.</p>
                )}
              </div>
            </div>
          ),
        },
      ]}
    >
      <button type="button" className={styles.logsButton}>
        Logs anzeigen
      </button>
    </InspectorPanel>
  );
}
