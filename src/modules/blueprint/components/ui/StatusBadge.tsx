/**
 * Status pill for Blueprint infrastructure and security states.
 * Location: src/modules/blueprint/components/ui/
 */

import styles from "./StatusBadge.module.css";

export type StatusBadgeVariant =
  | "running"
  | "confirmed"
  | "missing"
  | "unknown"
  | "warning"
  | "critical";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label: string;
}

export function StatusBadge({ variant, label }: StatusBadgeProps): JSX.Element {
  return (
    <span className={styles.root} data-variant={variant}>
      {label}
    </span>
  );
}
