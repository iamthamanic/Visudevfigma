/**
 * Inspektor for selected architecture node — responsibilities, services table, dependencies.
 */

import type { SoftwareGraph, SoftwareGraphNode } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import styles from "../../styles/ArchitectureView.module.css";

const KIND_LABELS: Record<string, string> = {
  domain: "Domain",
  layer: "Layer",
  module: "Module",
  route: "Route",
  service: "Service",
  repository: "Repository",
  table: "Table",
};

const RESPONSIBILITIES: Record<string, string[]> = {
  domain: ["Fachlicher Kontext", "Modulgrenzen"],
  layer: ["Schicht-Verantwortung", "Enthaltene Services"],
  module: ["Code-Modul", "Implementierung"],
};

const LAYER_DESCRIPTIONS: Record<string, string> = {
  "experience layer": "UI, Routing und Nutzerinteraktion.",
  "application layer": "Anwendungslogik, Use Cases und Orchestrierung.",
  "domain layer": "Fachdomänen, Entitäten und Geschäftsregeln.",
  "integration layer": "Externe APIs, Adapter und Messaging.",
  "persistence layer": "Datenbanken, Repositories und Speicher.",
  "processing layer": "Hintergrundjobs, Queues und Batch-Verarbeitung.",
  "platform layer": "Infrastruktur, Auth, Observability und Deployment.",
};

interface ArchitectureInspectorProps {
  graph: SoftwareGraph;
  node: SoftwareGraphNode | null;
}

interface ServiceRow {
  id: string;
  label: string;
  kind: string;
  moduleLabel: string;
  count: number;
}

function readDescription(node: SoftwareGraphNode): string {
  const fromMetadata =
    typeof node.metadata?.description === "string" ? node.metadata.description.trim() : "";
  if (fromMetadata.length > 0) return fromMetadata;
  if (node.kind === "layer") {
    return LAYER_DESCRIPTIONS[node.label.trim().toLowerCase()] ?? "Architektur-Ebene im System.";
  }
  return `${KIND_LABELS[node.kind] ?? node.kind}-Knoten im SoftwareGraph.`;
}

function listOutgoingDependencies(graph: SoftwareGraph, nodeId: string): string[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  return edges
    .filter(
      (edge) => edge.sourceId === nodeId && edge.kind !== "contains" && nodeById.has(edge.targetId),
    )
    .map((edge) => {
      const target = nodeById.get(edge.targetId);
      return target ? target.label : edge.targetId;
    });
}

function listIncomingDependencies(graph: SoftwareGraph, nodeId: string): string[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  return edges
    .filter(
      (edge) => edge.targetId === nodeId && edge.kind !== "contains" && nodeById.has(edge.sourceId),
    )
    .map((edge) => {
      const source = nodeById.get(edge.sourceId);
      return source ? source.label : edge.sourceId;
    });
}

function listContainedServices(graph: SoftwareGraph, nodeId: string): ServiceRow[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  const rows: ServiceRow[] = [];
  const seenChildIds = new Set<string>();
  const countByLabel = new Map<string, number>();

  for (const edge of edges) {
    if (edge.kind !== "contains" || edge.sourceId !== nodeId) continue;
    const child = nodeById.get(edge.targetId);
    if (!child) continue;
    const labelKey = child.label.trim().toLowerCase();
    countByLabel.set(labelKey, (countByLabel.get(labelKey) ?? 0) + 1);
    if (seenChildIds.has(child.id)) continue;
    seenChildIds.add(child.id);
    rows.push({
      id: child.id,
      label: child.label,
      kind: KIND_LABELS[child.kind] ?? child.kind,
      moduleLabel: child.kind === "module" ? child.label : "—",
      count: 0,
    });
  }

  return rows.map((row) => ({
    ...row,
    count: countByLabel.get(row.label.trim().toLowerCase()) ?? 1,
  }));
}

export function ArchitectureInspector({ graph, node }: ArchitectureInspectorProps): JSX.Element {
  if (!node) {
    return (
      <div data-testid="architecture-inspector">
        <InspectorPanel
          title="Keine Auswahl"
          emptyMessage="Wähle einen Layer, Domain oder Module im Stack."
        />
      </div>
    );
  }

  const services = listContainedServices(graph, node.id);
  const outgoing = listOutgoingDependencies(graph, node.id);
  const incoming = listIncomingDependencies(graph, node.id);
  const responsibilities = RESPONSIBILITIES[node.kind] ?? ["Architektur-Knoten"];
  const description = readDescription(node);

  return (
    <div data-testid="architecture-inspector">
      <InspectorPanel
        title={node.label}
        subtitle={KIND_LABELS[node.kind] ?? node.kind}
        sections={[
          {
            id: "description",
            title: "Beschreibung",
            content: <p className={styles.inspectorDescription}>{description}</p>,
          },
          {
            id: "responsibilities",
            title: "Verantwortlichkeiten",
            content: (
              <ul className={styles.checklist}>
                {responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          },
          {
            id: "services",
            title: "Enthaltene Services",
            content:
              services.length === 0 ? (
                <p className={styles.emptyControls}>Keine enthaltenen Services.</p>
              ) : (
                <table className={styles.servicesTable}>
                  <thead>
                    <tr>
                      <th scope="col">Service</th>
                      <th scope="col">Modul</th>
                      <th scope="col">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id}>
                        <td>{service.label}</td>
                        <td>{service.moduleLabel}</td>
                        <td>{service.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ),
          },
          {
            id: "dependencies",
            title: "Abhängigkeiten",
            content: (
              <div className={styles.dependencyGroups}>
                <div>
                  <p className={styles.dependencyHeading}>
                    <span className={styles.depDotOutgoing} aria-hidden="true" />
                    NUTZT
                  </p>
                  {outgoing.length === 0 ? (
                    <p className={styles.emptyControls}>Keine ausgehenden Abhängigkeiten.</p>
                  ) : (
                    <ul className={styles.checklist}>
                      {outgoing.map((dependency) => (
                        <li key={`out:${dependency}`}>{dependency}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className={styles.dependencyHeading}>
                    <span className={styles.depDotIncoming} aria-hidden="true" />
                    WIRD GENUTZT VON
                  </p>
                  {incoming.length === 0 ? (
                    <p className={styles.emptyControls}>Keine eingehenden Abhängigkeiten.</p>
                  ) : (
                    <ul className={styles.checklist}>
                      {incoming.map((dependency) => (
                        <li key={`in:${dependency}`}>{dependency}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
