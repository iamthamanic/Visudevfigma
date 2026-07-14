/**
 * Inspektor for InfrastructureView with resource meters and responsibilities.
 */

import type { GraphCanvasNode } from "../../types";
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

const RESPONSIBILITIES: Record<string, string[]> = {
  runtime: ["Prozess-Host", "Deployment-Ziel"],
  service: ["HTTP-Endpunkte", "Business-Logik"],
  external: ["Externe Integration", "Netzwerk-Aufrufe"],
  table: ["Persistenz", "Schema-Zugriff"],
  file: ["Request-Handler", "Routing-Einstieg"],
  route: ["API-Route", "Middleware-Kette"],
};

export interface InfrastructureInspectorProps {
  node: GraphCanvasNode | null;
}

export function InfrastructureInspector({ node }: InfrastructureInspectorProps): JSX.Element {
  if (!node) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Service, um Status und Ressourcen zu sehen."
      />
    );
  }

  const kindLabel = KIND_LABELS[node.kind] ?? node.kind;
  const responsibilities = RESPONSIBILITIES[node.kind] ?? ["Allgemeiner Graph-Knoten"];

  return (
    <InspectorPanel
      title={node.label}
      subtitle={kindLabel}
      badges={<StatusBadge variant="running" label="RUNNING" />}
      sections={[
        {
          id: "resources",
          title: "Ressourcen",
          content: (
            <>
              <InfrastructureResourceMeters values={STATIC_PLACEHOLDER_METERS} />
              <p className={styles.emptyControls}>
                Platzhalter-Werte — Telemetrie-Integration folgt in einer späteren Phase.
              </p>
            </>
          ),
        },
        {
          id: "responsibilities",
          title: "Verantwortlichkeiten",
          content: (
            <ul className={styles.responsibilityList}>
              {responsibilities.map((responsibility) => (
                <li key={responsibility}>{responsibility}</li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}
