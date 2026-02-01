import clsx from "clsx";
import { Layer } from "../types";
import styles from "./LayerFilter.module.css";

interface LayerFilterProps {
  selectedLayers: Set<Layer>;
  onToggleLayer: (layer: Layer) => void;
}

const layers: { key: Layer; label: string }[] = [
  { key: "frontend", label: "Frontend" },
  { key: "compute", label: "Compute" },
  { key: "data", label: "Data" },
  { key: "external", label: "External" },
  { key: "policies", label: "Policies" },
];

export function LayerFilter({ selectedLayers, onToggleLayer }: LayerFilterProps) {
  return (
    <div className={styles.root}>
      <span className={styles.label}>Layer:</span>
      {layers.map(({ key, label }) => {
        const isSelected = selectedLayers.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggleLayer(key)}
            type="button"
            data-layer={key}
            data-selected={isSelected}
            className={clsx(styles.button, isSelected && styles.buttonSelected)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
