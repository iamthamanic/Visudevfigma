/**
 * Right-hand inspector panel for Blueprint views (Figma Inspektor).
 * Location: src/modules/blueprint/components/ui/
 */

import type { ReactNode } from "react";
import { ViewSectionTitle } from "./ViewSectionTitle.js";
import styles from "./InspectorPanel.module.css";

export interface InspectorSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface InspectorPanelProps {
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  sections?: InspectorSection[];
  children?: ReactNode;
  emptyMessage?: string;
  testId?: string;
}

export function InspectorPanel({
  title,
  subtitle,
  badges,
  sections,
  children,
  emptyMessage,
  testId,
}: InspectorPanelProps): JSX.Element {
  const hasBody = Boolean(children) || Boolean(sections?.length);

  return (
    <aside className={styles.root} aria-label="Inspektor" data-testid={testId}>
      <header className={styles.header}>
        <ViewSectionTitle>Inspektor</ViewSectionTitle>
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {badges ? <div className={styles.badges}>{badges}</div> : null}
      </header>

      <div className={styles.body}>
        {!hasBody && emptyMessage ? <p className={styles.empty}>{emptyMessage}</p> : null}
        {sections?.map((section) => (
          <section key={section.id} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <div className={styles.sectionContent}>{section.content}</div>
          </section>
        ))}
        {children}
      </div>
    </aside>
  );
}
