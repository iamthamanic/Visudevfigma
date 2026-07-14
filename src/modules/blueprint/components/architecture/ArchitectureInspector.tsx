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

interface ArchitectureInspectorProps {
  graph: SoftwareGraph;
  node: SoftwareGraphNode | null;
}

interface ServiceRow {
  id: string;
  label: string;
  kind: string;
}

function listDependencies(graph: SoftwareGraph, nodeId: string): string[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  return edges
    .filter(
      (edge) => edge.sourceId === nodeId && edge.kind !== "contains" && nodeById.has(edge.targetId),
    )
    .map((edge) => {
      const target = nodeById.get(edge.targetId);
      return target ? `${edge.kind} → ${target.label}` : edge.kind;
    });
}

function listContainedServices(graph: SoftwareGraph, nodeId: string): ServiceRow[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  return edges
    .filter((edge) => edge.kind === "contains" && edge.sourceId === nodeId)
    .map((edge) => nodeById.get(edge.targetId))
    .filter((entry): entry is SoftwareGraphNode => entry != null)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      kind: KIND_LABELS[entry.kind] ?? entry.kind,
    }));
}

export function ArchitectureInspector({ graph, node }: ArchitectureInspectorProps): JSX.Element {
  if (!node) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Layer, Domain oder Module im Stack."
      />
    );
  }

  const services = listContainedServices(graph, node.id);
  const dependencies = listDependencies(graph, node.id);
  const responsibilities = RESPONSIBILITIES[node.kind] ?? ["Architektur-Knoten"];

  return (
    <InspectorPanel
      title={node.label}
      subtitle={KIND_LABELS[node.kind] ?? node.kind}
      sections={[
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
          title: "Services",
          content:
            services.length === 0 ? (
              <p className={styles.emptyControls}>Keine enthaltenen Services.</p>
            ) : (
              <table className={styles.servicesTable}>
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td>{service.label}</td>
                      <td>{service.kind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
        },
        {
          id: "dependencies",
          title: "Abhängigkeiten",
          content:
            dependencies.length === 0 ? (
              <p className={styles.emptyControls}>Keine Abhängigkeiten.</p>
            ) : (
              <ul className={styles.checklist}>
                {dependencies.map((dependency) => (
                  <li key={dependency}>{dependency}</li>
                ))}
              </ul>
            ),
        },
      ]}
    />
  );
}
