/**
 * Resource meter bars for infrastructure inspector (placeholder values when graph has no metrics).
 */

import styles from "../../styles/InfrastructureView.module.css";

export interface ResourceMeterValues {
  cpu: number;
  ram: number;
  network: number;
}

interface ResourceMeterProps {
  label: string;
  value: number;
}

function ResourceMeter({ label, value }: ResourceMeterProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={styles.meterRow}>
      <div className={styles.meterHeader}>
        <span>{label}</span>
        <span className={styles.meterValue}>{clamped}%</span>
      </div>
      <progress
        className={styles.meterTrack}
        value={clamped}
        max={100}
        aria-label={`${label} Auslastung`}
      />
    </div>
  );
}

export function InfrastructureResourceMeters({
  values,
}: {
  values: ResourceMeterValues;
}): JSX.Element {
  return (
    <div className={styles.meterGroup}>
      <ResourceMeter label="CPU" value={values.cpu} />
      <ResourceMeter label="RAM" value={values.ram} />
      <ResourceMeter label="Netzwerk" value={values.network} />
    </div>
  );
}
