/**
 * View title header for Blueprint shell (German labels + breadcrumb).
 * Location: src/modules/blueprint/components/
 */

import { getBlueprintViewLabel, type BlueprintShellViewId } from "../blueprint-view-config.js";
import styles from "../styles/BlueprintViewHeader.module.css";

interface BlueprintViewHeaderProps {
  activeView: BlueprintShellViewId;
  projectName?: string;
  branchLabel?: string;
}

export function BlueprintViewHeader({
  activeView,
  projectName,
  branchLabel,
}: BlueprintViewHeaderProps): JSX.Element {
  const viewLabel = getBlueprintViewLabel(activeView);

  return (
    <header className={styles.root}>
      <p className={styles.kicker}>Blueprint</p>
      <h2 className={styles.title}>{viewLabel}</h2>
      {projectName ? (
        <p className={styles.breadcrumb}>
          {projectName}
          {branchLabel ? ` › ${branchLabel}` : null}
        </p>
      ) : null}
    </header>
  );
}
