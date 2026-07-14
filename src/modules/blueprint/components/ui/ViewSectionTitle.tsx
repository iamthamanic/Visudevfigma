/**
 * Uppercase section heading for Blueprint views (e.g. BEZIEHUNGSTYPEN, INSPECTOR).
 * Location: src/modules/blueprint/components/ui/
 */

import styles from "./ViewSectionTitle.module.css";

interface ViewSectionTitleProps {
  children: string;
  className?: string;
}

export function ViewSectionTitle({ children, className }: ViewSectionTitleProps): JSX.Element {
  return <h3 className={className ? `${styles.root} ${className}` : styles.root}>{children}</h3>;
}
