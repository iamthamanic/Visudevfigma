/**
 * Inspektor for InfrastructureView with overview, resource meters, and connections.
 */

import type { GraphCanvasEdge, GraphCanvasNode, SoftwareGraphNode } from "../../types";
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

interface ConnectionEndpoint {
  edgeId: string;
  label: string;
}

function overviewFromGraphNode(graphNode: SoftwareGraphNode | null) {
  const metadata = graphNode?.metadata ?? {};
  const portValue = metadata.port;
  const frameworkValue = metadata.framework;
  const instancesValue = metadata.instances;

  return {
    port: typeof portValue === "number" || typeof portValue === "string" ? String(portValue) : "—",
    instances: typeof instancesValue === "string" ? instancesValue : "1",
    uptime: "99,5 %",
    version: typeof frameworkValue === "string" ? frameworkValue : "—",
  };
}

function connectionEndpoints(
  nodeId: string,
  edges: GraphCanvasEdge[],
  nodes: GraphCanvasNode[],
): { incoming: ConnectionEndpoint[]; outgoing: ConnectionEndpoint[] } {
  const labelById = new Map(nodes.map((node) => [node.id, node.label]));
  const incoming = edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => ({
      edgeId: edge.id,
      label: labelById.get(edge.source) ?? edge.source,
    }));
  const outgoing = edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => ({
      edgeId: edge.id,
      label: labelById.get(edge.target) ?? edge.target,
    }));
  return { incoming, outgoing };
}

export interface InfrastructureInspectorProps {
  node: GraphCanvasNode | null;
  graphNode?: SoftwareGraphNode | null;
  edges?: GraphCanvasEdge[];
  nodes?: GraphCanvasNode[];
}

export function InfrastructureInspector({
  node,
  graphNode = null,
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
  const overview = overviewFromGraphNode(graphNode);
  const connections = connectionEndpoints(node.id, edges, nodes);

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
                    {connections.incoming.map((endpoint) => (
                      <li key={`in-${endpoint.edgeId}`}>{endpoint.label}</li>
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
                    {connections.outgoing.map((endpoint) => (
                      <li key={`out-${endpoint.edgeId}`}>{endpoint.label}</li>
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
