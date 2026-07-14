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
    <span className={styles.liveBadgeWrap}>
      <StatusBadge variant="running" label="LIVE" />
    </span>
  );
}
