/**
 * Pulsing LIVE badge — only when route/step metadata still reports running (active scan stub).
 */

import { StatusBadge } from "../ui/StatusBadge.js";
import styles from "../../styles/ExecutionView.module.css";

export interface ExecutionLiveBadgeProps {
  live: boolean;
}

export function ExecutionLiveBadge({ live }: ExecutionLiveBadgeProps): JSX.Element | null {
  if (!live) return null;

  return (
    <span className={styles.liveBadgeWrap} data-testid="execution-live-badge">
      <span className={styles.liveSignal} aria-hidden="true">
        ●
      </span>
      <StatusBadge variant="running" label="Live (Streaming)" />
    </span>
  );
}
