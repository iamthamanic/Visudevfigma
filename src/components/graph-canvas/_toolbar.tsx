import styles from "../GraphCanvas.module.css";

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function GraphToolbar({ onZoomIn, onZoomOut, onFit }: GraphToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.toolButton}
        onClick={onZoomIn}
        aria-label="Vergrößern"
      >
        +
      </button>
      <button
        type="button"
        className={styles.toolButton}
        onClick={onZoomOut}
        aria-label="Verkleinern"
      >
        −
      </button>
      <button type="button" className={styles.toolButton} onClick={onFit} aria-label="Anpassen">
        Passend
      </button>
    </div>
  );
}
