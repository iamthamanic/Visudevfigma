/**
 * AtlasZoomControls — canvas zoom toolbar (bottom-right overlay).
 */

import { useState } from "react";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCenter?: () => void;
}

export function AtlasZoomControls({
  onZoomIn,
  onZoomOut,
  onCenter,
}: AtlasZoomControlsProps): JSX.Element {
  const [zoomPercent, setZoomPercent] = useState(100);

  const handleZoomIn = () => {
    setZoomPercent((current) => Math.min(200, current + 10));
    onZoomIn?.();
  };

  const handleZoomOut = () => {
    setZoomPercent((current) => Math.max(50, current - 10));
    onZoomOut?.();
  };

  const handleCenter = () => {
    setZoomPercent(100);
    onCenter?.();
  };

  return (
    <div className={styles.zoomControls} data-testid="atlas-zoom-controls" aria-label="Zoom">
      <button
        type="button"
        className={styles.zoomButton}
        onClick={handleZoomOut}
        title="Verkleinern"
      >
        −
      </button>
      <span className={styles.zoomValue}>{zoomPercent}%</span>
      <button type="button" className={styles.zoomButton} onClick={handleZoomIn} title="Vergrößern">
        +
      </button>
      <button
        type="button"
        className={styles.zoomButton}
        onClick={handleCenter}
        title="Ansicht zentrieren"
      >
        ⊙
      </button>
    </div>
  );
}
