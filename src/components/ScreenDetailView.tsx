/**
 * ScreenDetailView Component
 *
 * Displays detailed information about a screen including:
 * - Screen metadata
 * - Associated flows
 * - LIVE PREVIEW of the screen using iframe
 */

import React from "react";
import clsx from "clsx";
import { X, Code, FileText, GitBranch, ExternalLink, Eye } from "lucide-react";
import { CodePreview } from "./CodePreview";
import styles from "./ScreenDetailView.module.css";

interface Screen {
  id: string;
  name: string;
  path: string;
  filePath?: string;
  type?: "page" | "screen" | "view";
  flows?: string[];
  navigatesTo?: string[];
  framework?: string;
  componentCode?: string;
  screenshotUrl?: string; // NEW: Screenshot from deployed URL
  screenshotStatus?: "none" | "pending" | "ok" | "failed";
  lastScreenshotCommit?: string;
  depth?: number;
}

interface CodeFlow {
  id: string;
  type: "ui-event" | "function-call" | "api-call" | "db-query" | "navigation" | "api";
  name: string;
  file?: string;
  line?: number;
  code?: string;
  calls?: string[];
  color?: string;
  source?: string;
  target?: string;
  trigger?: string;
  description?: string;
}

interface ScreenDetailViewProps {
  screen: Screen;
  flows: CodeFlow[];
  onClose: () => void;
  onNavigateToScreen?: (screenPath: string) => void;
}

export function ScreenDetailView({
  screen,
  flows,
  onClose,
  onNavigateToScreen,
}: ScreenDetailViewProps) {
  // Get flows for this screen (safe access)
  const screenFlows = flows.filter((flow) => screen.flows?.includes(flow.id));

  // Group flows by type
  const flowsByType = {
    "ui-event": screenFlows.filter((f) => f.type === "ui-event"),
    "api-call": screenFlows.filter((f) => f.type === "api-call"),
    "db-query": screenFlows.filter((f) => f.type === "db-query"),
    "function-call": screenFlows.filter((f) => f.type === "function-call"),
  };

  const flowTypeLabels: Record<string, string> = {
    "ui-event": "UI Events",
    "api-call": "API Calls",
    "db-query": "Database Queries",
    "function-call": "Functions",
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{screen.name}</h2>
              <span className={clsx(styles.badge, styles.badgeType)}>
                {screen.type ?? "screen"}
              </span>
              {screen.framework && (
                <span className={clsx(styles.badge, styles.badgeFramework)}>
                  {screen.framework}
                </span>
              )}
            </div>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <FileText className={styles.metaIcon} />
                <span>{screen.filePath}</span>
              </div>
              <div className={styles.metaItem}>
                <Code className={styles.metaIcon} />
                <span>{screen.path}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} type="button" className={styles.closeButton}>
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Left Sidebar: Flows */}
          <div className={styles.sidebar}>
            {/* Navigation Links */}
            {(screen.navigatesTo?.length ?? 0) > 0 && (
              <div>
                <h3 className={styles.sectionTitle}>
                  <GitBranch className={styles.metaIcon} />
                  Navigates To ({screen.navigatesTo?.length ?? 0})
                </h3>
                <div className={styles.navList}>
                  {screen.navigatesTo?.map((path, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigateToScreen?.(path)}
                      type="button"
                      className={styles.navButton}
                    >
                      <ExternalLink className={styles.navIcon} />
                      {path}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flows by Type */}
            {Object.entries(flowsByType).map(([type, typeFlows]) => {
              if (typeFlows.length === 0) return null;

              return (
                <div key={type} className={styles.flowSection}>
                  <h3 className={styles.flowHeading}>
                    {flowTypeLabels[type] ?? type} ({typeFlows.length})
                  </h3>
                  <div className={styles.flowList}>
                    {typeFlows.map((flow) => (
                      <div key={flow.id} className={styles.flowCard}>
                        <div className={styles.flowRow}>
                          <div className={styles.flowDot} data-flow-type={type} />
                          <div className={styles.flowMeta}>
                            <div className={styles.flowName}>{flow.name}</div>
                            <div className={styles.flowLine}>Line {flow.line}</div>
                            <div className={styles.flowCode}>{flow.code}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {screenFlows.length === 0 && (
              <div className={styles.emptyState}>No flows detected in this screen</div>
            )}
          </div>

          {/* Right Side: Live Preview */}
          <div className={styles.preview}>
            {screen.screenshotUrl ? (
              // Show screenshot if available
              <div className={styles.screenshotWrap}>
                <img
                  src={screen.screenshotUrl}
                  alt={screen.name}
                  className={styles.screenshotImage}
                />
                <div className={styles.screenshotMeta}>
                  <Eye className={styles.navIcon} />
                  <span>Screenshot from deployed URL</span>
                  {screen.lastScreenshotCommit && (
                    <span className={styles.commitSha}>
                      @ {screen.lastScreenshotCommit.slice(0, 7)}
                    </span>
                  )}
                </div>
              </div>
            ) : screen.componentCode ? (
              <CodePreview code={screen.componentCode} className={styles.codePreview} />
            ) : (
              <div className={styles.emptyPreview}>
                <div className={styles.emptyContent}>
                  <Code className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No Preview Available</h3>
                  <p className={styles.emptyText}>Add a deployed_url to capture screenshots</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
