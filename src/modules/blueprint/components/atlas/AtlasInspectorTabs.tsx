/**
 * Inspektor sub-tabs for AtlasView — Übersicht, Details, Abhängigkeiten, Deployments.
 */

import { useState } from "react";
import type { SoftwareGraph, SoftwareGraphGroup, SoftwareGraphNode } from "../../types";
import {
  atlasKindLabel,
  findGroupsForNode,
  listDeploymentHints,
  listIncomingDependencies,
  listOutgoingDependencies,
} from "./atlas-display.js";
import styles from "../../styles/AtlasView.module.css";

const INSPECTOR_TABS = [
  { id: "overview", label: "Übersicht" },
  { id: "details", label: "Details" },
  { id: "dependencies", label: "Abhängigkeiten" },
  { id: "deployments", label: "Deployments" },
] as const;

type InspectorTabId = (typeof INSPECTOR_TABS)[number]["id"];

export interface AtlasInspectorTabsProps {
  graph: SoftwareGraph;
  node: SoftwareGraphNode | null;
  cluster: SoftwareGraphGroup | null;
}

function resolveNodeLabels(graph: SoftwareGraph, nodeIds: string[]): string[] {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));
  return nodeIds.map((nodeId) => nodeById.get(nodeId)?.label ?? nodeId).slice(0, 24);
}

export function AtlasInspectorTabs({ graph, node, cluster }: AtlasInspectorTabsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<InspectorTabId>("overview");

  if (!node && !cluster) {
    return (
      <div className={styles.inspectorEmpty}>
        <p>Wähle einen Knoten oder Cluster auf der Karte.</p>
      </div>
    );
  }

  const titleNode = node ?? null;
  const outgoing = titleNode ? listOutgoingDependencies(graph, titleNode.id) : [];
  const incoming = titleNode ? listIncomingDependencies(graph, titleNode.id) : [];
  const deployments = titleNode ? listDeploymentHints(graph, titleNode) : [];
  const nodeGroups = titleNode ? findGroupsForNode(graph, titleNode.id) : [];
  const clusterMembers = cluster ? resolveNodeLabels(graph, cluster.nodeIds) : [];

  return (
    <div className={styles.inspectorTabs}>
      <div className={styles.tabList} role="tablist" aria-label="Atlas-Inspektor">
        {INSPECTOR_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabPanel} role="tabpanel">
        {activeTab === "overview" ? (
          <dl className={styles.detailList}>
            <div className={styles.detailRow}>
              <dt>Name</dt>
              <dd>{cluster?.label ?? titleNode?.label ?? "—"}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Typ</dt>
              <dd>{atlasKindLabel(cluster?.kind ?? titleNode?.kind ?? "—")}</dd>
            </div>
            {cluster ? (
              <div className={styles.detailRow}>
                <dt>Knoten</dt>
                <dd>{cluster.nodeIds.length}</dd>
              </div>
            ) : null}
            {titleNode && nodeGroups.length > 0 ? (
              <div className={styles.detailRow}>
                <dt>Cluster</dt>
                <dd>{nodeGroups.map((group) => group.label).join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {activeTab === "details" ? (
          cluster ? (
            clusterMembers.length === 0 ? (
              <p className={styles.emptyControls}>Keine Knoten in diesem Cluster.</p>
            ) : (
              <ul className={styles.checklist}>
                {clusterMembers.map((member) => (
                  <li key={member}>{member}</li>
                ))}
              </ul>
            )
          ) : titleNode ? (
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <dt>ID</dt>
                <dd>{titleNode.id}</dd>
              </div>
              {titleNode.filePath ? (
                <div className={styles.detailRow}>
                  <dt>Datei</dt>
                  <dd>
                    {titleNode.filePath}
                    {titleNode.line ? `:${titleNode.line}` : ""}
                  </dd>
                </div>
              ) : null}
              {titleNode.scopeId ? (
                <div className={styles.detailRow}>
                  <dt>Scope</dt>
                  <dd>{titleNode.scopeId}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className={styles.emptyControls}>Keine Detaildaten.</p>
          )
        ) : null}

        {activeTab === "dependencies" ? (
          cluster ? (
            <p className={styles.emptyControls}>
              Wähle einen einzelnen Knoten, um eingehende und ausgehende Abhängigkeiten zu sehen.
            </p>
          ) : outgoing.length === 0 && incoming.length === 0 ? (
            <p className={styles.emptyControls}>Keine Abhängigkeiten.</p>
          ) : (
            <>
              {outgoing.length > 0 ? (
                <>
                  <h4 className={styles.subSectionTitle}>Ausgehend</h4>
                  <ul className={styles.checklist}>
                    {outgoing.map((dependency) => (
                      <li key={dependency}>{dependency}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {incoming.length > 0 ? (
                <>
                  <h4 className={styles.subSectionTitle}>Eingehend</h4>
                  <ul className={styles.checklist}>
                    {incoming.map((dependency) => (
                      <li key={dependency}>{dependency}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )
        ) : null}

        {activeTab === "deployments" ? (
          cluster ? (
            <p className={styles.emptyControls}>
              Deployment-Hinweise sind pro Knoten verfügbar. Wähle einen Knoten im Cluster.
            </p>
          ) : deployments.length === 0 ? (
            <p className={styles.emptyControls}>
              Keine Deployment- oder Laufzeit-Metadaten im Software Graph.
            </p>
          ) : (
            <ul className={styles.checklist}>
              {deployments.map((deployment) => (
                <li key={deployment}>{deployment}</li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
