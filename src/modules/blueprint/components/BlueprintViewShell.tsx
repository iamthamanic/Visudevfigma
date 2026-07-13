/**
 * Blueprint view shell — Infrastructure, Architecture, and Diagnostics tabs.
 */

import { useEffect, useRef, useState } from "react";
import { ArchitectureView } from "./ArchitectureView";
import { DiagnosticsView } from "./DiagnosticsView";
import { InfrastructureView } from "./InfrastructureView";
import {
  getDefaultBlueprintView,
  type BlueprintShellViewId,
} from "./infrastructure/_default-view.js";
import type { BlueprintData } from "../types";
import styles from "../styles/BlueprintViewShell.module.css";

const VIEWS = [
  { id: "infrastructure", label: "Infrastructure" },
  { id: "architecture", label: "Architecture" },
  { id: "diagnostics", label: "Diagnostics" },
] as const;

interface BlueprintViewShellProps {
  blueprint: BlueprintData;
}

export function BlueprintViewShell({ blueprint }: BlueprintViewShellProps) {
  const userSelectedViewRef = useRef(false);
  const [activeView, setActiveView] = useState<BlueprintShellViewId>(getDefaultBlueprintView);

  useEffect(() => {
    if (!userSelectedViewRef.current) {
      setActiveView(getDefaultBlueprintView());
    }
  }, [blueprint]);

  const handleSelectView = (viewId: BlueprintShellViewId) => {
    userSelectedViewRef.current = true;
    setActiveView(viewId);
  };

  return (
    <div className={styles.root}>
      <div className={styles.tabBar} role="tablist" aria-label="Blueprint views">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={activeView === view.id}
            aria-controls={`blueprint-panel-${view.id}`}
            id={`blueprint-tab-${view.id}`}
            onClick={() => handleSelectView(view.id)}
            className={`${styles.tab} ${activeView === view.id ? styles.tabActive : ""}`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {activeView === "infrastructure" ? (
          <div
            role="tabpanel"
            id="blueprint-panel-infrastructure"
            aria-labelledby="blueprint-tab-infrastructure"
            className={styles.panelContent}
          >
            <InfrastructureView blueprint={blueprint} />
          </div>
        ) : activeView === "architecture" ? (
          <div
            role="tabpanel"
            id="blueprint-panel-architecture"
            aria-labelledby="blueprint-tab-architecture"
            className={styles.panelContent}
          >
            <ArchitectureView blueprint={blueprint} />
          </div>
        ) : (
          <div
            role="tabpanel"
            id="blueprint-panel-diagnostics"
            aria-labelledby="blueprint-tab-diagnostics"
            className={styles.panelContent}
          >
            <DiagnosticsView blueprint={blueprint} />
          </div>
        )}
      </div>
    </div>
  );
}
