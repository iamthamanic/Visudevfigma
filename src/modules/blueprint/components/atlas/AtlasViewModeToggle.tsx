/**
 * 2D | 3D toggle for Atlas toolbar — keyboard accessible, 3D disabled when reduced motion.
 */

import { ATLAS_VIEW_MODES, type AtlasViewMode } from "./atlas-view-mode.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasViewModeToggleProps {
  mode: AtlasViewMode;
  threeDisabled: boolean;
  onSelectMode: (mode: AtlasViewMode) => void;
}

export function AtlasViewModeToggle({
  mode,
  threeDisabled,
  onSelectMode,
}: AtlasViewModeToggleProps): JSX.Element {
  return (
    <div className={styles.viewModeToggle} role="group" aria-label="Atlas-Ansicht">
      {ATLAS_VIEW_MODES.map((option) => {
        const disabled = option.id === "3d" && threeDisabled;
        return (
          <button
            key={option.id}
            type="button"
            className={`${styles.viewModeButton} ${mode === option.id ? styles.viewModeButtonActive : ""}`}
            aria-pressed={mode === option.id}
            disabled={disabled}
            title={
              disabled
                ? "3D-Stadtmodus ist bei „Bewegung reduzieren“ deaktiviert. Nutze 2D."
                : undefined
            }
            onClick={() => onSelectMode(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
