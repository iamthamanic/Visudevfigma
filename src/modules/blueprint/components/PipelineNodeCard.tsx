/**
 * PipelineNodeCard — single node in the Route Blueprint linear flow.
 * Location: src/modules/blueprint/components/PipelineNodeCard.tsx
 */

import type { BlueprintFinding, PipelineNode } from "../types";
import { isCoreGate, slotCategory } from "../services/blueprint-pipeline";
import { relatedFindingsForNode } from "../services/blueprint-node-findings";
import styles from "../styles/PipelineNodeCard.module.css";

interface PipelineNodeCardProps {
  node: PipelineNode;
  findings: BlueprintFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string | null) => void;
}

export function PipelineNodeCard({
  node,
  findings,
  selectedFindingId,
  onSelectFinding,
}: PipelineNodeCardProps) {
  const related = relatedFindingsForNode(node, findings);
  const hasRelated = related.length > 0;
  const isSelected = selectedFindingId !== null && related.some((f) => f.id === selectedFindingId);

  return (
    <button
      type="button"
      className={`${styles.node} ${stateClass(node.state)} ${typeClass(node.type)} ${
        isPlaceholder(node) ? styles.placeholder : ""
      } ${hasRelated ? styles.hasFindings : ""} ${isSelected ? styles.selected : ""}`}
      onClick={() => handleClick(related, selectedFindingId, onSelectFinding)}
      aria-label={`${node.label} — ${stateLabel(node.state)}`}
      aria-pressed={isSelected}
    >
      <span className={styles.label}>{node.label}</span>
      <span className={styles.state}>{stateLabel(node.state)}</span>
      {hasRelated && (
        <span className={styles.badge} aria-hidden="true">
          {related.length}
        </span>
      )}
    </button>
  );
}

function handleClick(
  related: BlueprintFinding[],
  selectedFindingId: string | null,
  onSelectFinding: (id: string | null) => void,
) {
  if (related.length === 0) return;
  const first = related[0].id;
  onSelectFinding(first === selectedFindingId ? null : first);
}

function isPlaceholder(node: PipelineNode): boolean {
  return (
    node.id.includes(":placeholder") ||
    (isCoreGate(node.type) && (node.state === "missing" || node.state === "unknown"))
  );
}

function stateClass(state: PipelineNode["state"]): string {
  if (state === "confirmed") return styles.stateConfirmed;
  if (state === "partial" || state === "weak") return styles.statePartial;
  if (state === "missing" || state === "contradictory") return styles.stateMissing;
  return styles.stateUnknown;
}

function stateLabel(state: PipelineNode["state"]): string {
  const labels: Record<PipelineNode["state"], string> = {
    confirmed: "Bestätigt",
    partial: "Teilweise",
    weak: "Schwach",
    missing: "Fehlt",
    unknown: "Unbekannt",
    contradictory: "Widerspruch",
  };
  return labels[state] ?? state;
}

function typeClass(type: string): string {
  const category = slotCategory(type);
  if (category === "data-flow") return styles.typeDataFlow;
  if (category === "framework") return styles.typeExternal;
  return styles.typeNormal;
}
