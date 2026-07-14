/** Figma service card; left-border color maps graph node kind to runtime accent tokens. */

import type { GraphCanvasNode } from "../../types";
import { StatusBadge } from "../ui/StatusBadge.js";
import styles from "../../styles/InfrastructureView.module.css";

const KIND_LABELS: Record<string, string> = {
  runtime: "Laufzeit",
  service: "API Service",
  external: "External Service",
  table: "Datenbank",
  file: "Web App",
  route: "Route",
};

export interface InfrastructureServiceCardProps {
  node: GraphCanvasNode;
  selected: boolean;
  onSelect: () => void;
}

export function InfrastructureServiceCard({
  node,
  selected,
  onSelect,
}: InfrastructureServiceCardProps): JSX.Element {
  const kindLabel = KIND_LABELS[node.kind] ?? node.kind;

  return (
    <button
      type="button"
      className={styles.serviceCard}
      data-selected={selected ? "true" : "false"}
      data-kind={node.kind}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.serviceCardHeader}>
        <span className={styles.serviceCardTitle}>{node.label}</span>
        <StatusBadge variant="running" label="RUNNING" />
      </span>
      <span className={styles.serviceCardMeta}>{kindLabel}</span>
    </button>
  );
}
