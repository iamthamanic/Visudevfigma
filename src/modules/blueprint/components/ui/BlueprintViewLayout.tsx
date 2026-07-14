/**
 * Shared three-column layout for Blueprint views: controls, canvas, inspector.
 * Location: src/modules/blueprint/components/ui/
 */

import type { ReactNode } from "react";
import styles from "./BlueprintViewLayout.module.css";

interface BlueprintViewLayoutProps {
  controls?: ReactNode;
  canvas: ReactNode;
  inspector?: ReactNode;
}

export function BlueprintViewLayout({
  controls,
  canvas,
  inspector,
}: BlueprintViewLayoutProps): JSX.Element {
  return (
    <div className={styles.root}>
      {controls ? <div className={styles.controls}>{controls}</div> : null}
      <div className={styles.canvas}>{canvas}</div>
      {inspector ? <div className={styles.inspector}>{inspector}</div> : null}
    </div>
  );
}
