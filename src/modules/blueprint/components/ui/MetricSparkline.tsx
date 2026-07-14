/**
 * MetricSparkline — renders snapshot node-count history; invalid samples become zero.
 */

import styles from "./MetricSparkline.module.css";

export interface MetricSparklineProps {
  values: number[];
}

export function MetricSparkline({ values }: MetricSparklineProps): JSX.Element {
  const samples = values.map((value) =>
    Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0,
  );
  const usable = samples.length > 0 ? samples : [0];
  const max = Math.max(...usable, 1);
  const width = 120;
  const height = 24;
  const points = usable
    .map((value, index) => {
      const x = usable.length === 1 ? width / 2 : (index / (usable.length - 1)) * width;
      const y = height - (value / max) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={styles.root} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline className={styles.line} points={points} />
    </svg>
  );
}
