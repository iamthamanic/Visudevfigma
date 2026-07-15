/**
 * Renders the four-column Evolution changes summary from git/diff paths.
 */

import type { GitSummary, SoftwareGraphDiffMetadata } from "../../types";
import { buildEvolutionChangesColumns } from "./evolution-changes-columns.js";
import styles from "../../styles/EvolutionView.module.css";

export interface EvolutionChangesGridProps {
  diff: SoftwareGraphDiffMetadata | null;
  gitSummary: GitSummary | null;
}

export function EvolutionChangesGrid({ diff, gitSummary }: EvolutionChangesGridProps): JSX.Element {
  const columns = buildEvolutionChangesColumns(diff, gitSummary);

  return (
    <section
      className={styles.changesGridSection}
      aria-label="Änderungsübersicht"
      data-testid="evolution-changes-grid"
    >
      <div className={styles.changesGrid}>
        {columns.map((column) => (
          <article
            key={column.id}
            className={styles.changesColumn}
            data-kind={column.id}
            data-testid="evolution-changes-column"
          >
            <p className={styles.changesColumnLabel}>
              {column.label} ({column.count})
            </p>
            {column.paths.length === 0 ? (
              <p className={styles.emptyControls}>Keine Einträge</p>
            ) : (
              <ul className={styles.changesItemList}>
                {column.paths.map((filePath) => (
                  <li
                    key={`${column.id}:${filePath}`}
                    className={styles.changesItem}
                    title={filePath}
                  >
                    {filePath}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
