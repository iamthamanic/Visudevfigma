/**
 * Timeline ruler — labels show cumulative endMs so step boundaries align with pipeline cards.
 */

import type { StepTiming } from "./_projection.js";
import styles from "../../styles/ExecutionView.module.css";

export interface ExecutionTimelineRulerProps {
  stepTimings: StepTiming[];
}

export function ExecutionTimelineRuler({
  stepTimings,
}: ExecutionTimelineRulerProps): JSX.Element | null {
  if (stepTimings.length === 0) return null;

  const totalMs = stepTimings.at(-1)?.endMs ?? 0;

  return (
    <div className={styles.timelineWrap} aria-label="Zeitachse" data-testid="execution-timeline">
      <div className={styles.timelineTrack}>
        {stepTimings.map((timing, index) => (
          <div key={timing.nodeId} className={styles.timelineSegment}>
            {index > 0 ? <span className={styles.timelineTick} aria-hidden="true" /> : null}
            <span className={styles.timelineLabel}>{timing.endMs}ms</span>
          </div>
        ))}
      </div>
      <p className={styles.timelineTotal}>Gesamt: {totalMs}ms</p>
    </div>
  );
}
