/**
 * Resource meter bars for infrastructure inspector (placeholder values when graph has no metrics).
 */

import styles from "../../styles/InfrastructureView.module.css";

export interface ResourceMeterValues {
  cpu: number;
  ram: number;
  networkIn: number;
  networkOut: number;
}

interface ResourceMeterProps {
  label: string;
  value: number;
  testId?: string;
}

function ResourceMeter({ label, value, testId }: ResourceMeterProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={styles.meterRow} data-testid={testId}>
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
      <ResourceMeter label="CPU" value={values.cpu} testId="infra-resource-cpu" />
      <ResourceMeter label="RAM" value={values.ram} testId="infra-resource-ram" />
      <ResourceMeter
        label="Netzwerk In"
        value={values.networkIn}
        testId="infra-resource-network-in"
      />
      <ResourceMeter
        label="Netzwerk Out"
        value={values.networkOut}
        testId="infra-resource-network-out"
      />
    </div>
  );
}
