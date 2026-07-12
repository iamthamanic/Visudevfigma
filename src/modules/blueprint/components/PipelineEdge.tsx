/**
 * PipelineEdge — horizontal connector between Route Blueprint nodes.
 * Location: src/modules/blueprint/components/PipelineEdge.tsx
 */

import styles from "../styles/PipelineEdge.module.css";

interface PipelineEdgeProps {
  dashed?: boolean;
}

export function PipelineEdge({ dashed = false }: PipelineEdgeProps) {
  return <div className={`${styles.edge} ${dashed ? styles.dashed : ""}`} aria-hidden="true" />;
}
