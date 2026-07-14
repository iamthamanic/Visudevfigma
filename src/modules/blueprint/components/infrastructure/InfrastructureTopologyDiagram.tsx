/**
 * HTML topology diagram: Internet → Load Balancer → Services → Database.
 */

import type { ReactNode } from "react";
import { MAX_TOPOLOGY_NODES_PER_TIER, type TopologyNodeRef } from "./build-topology.js";
import styles from "../../styles/InfrastructureView.module.css";

interface InfrastructureTopologyDiagramProps {
  nodes: TopologyNodeRef[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

function TierColumn({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className={styles.topologyTier}>
      <span className={styles.topologyTierLabel}>{title}</span>
      <div className={styles.topologyTierNodes}>{children}</div>
    </div>
  );
}

export function InfrastructureTopologyDiagram({
  nodes,
  selectedNodeId,
  onSelectNode,
}: InfrastructureTopologyDiagramProps): JSX.Element {
  const services = nodes.filter((node) => node.tier === "service");
  const databases = nodes.filter((node) => node.tier === "database");
  const visibleServices = services.slice(0, MAX_TOPOLOGY_NODES_PER_TIER);
  const visibleDatabases = databases.slice(0, MAX_TOPOLOGY_NODES_PER_TIER);
  const hiddenServiceCount = Math.max(0, services.length - visibleServices.length);
  const hiddenDatabaseCount = Math.max(0, databases.length - visibleDatabases.length);

  return (
    <div className={styles.topology} aria-label="Infrastruktur-Topologie">
      <div className={styles.topologyFlow}>
        <TierColumn title="Internet">
          <div className={styles.topologyStaticNode}>Internet</div>
        </TierColumn>

        <span className={styles.topologyArrow} aria-hidden="true">
          ──►
        </span>

        <TierColumn title="Load Balancer">
          <div className={styles.topologyStaticNode}>LB</div>
        </TierColumn>

        <span className={styles.topologyArrow} aria-hidden="true">
          ──►
        </span>

        <TierColumn title="Services">
          {services.length === 0 ? (
            <p className={styles.emptyControls}>Keine Services im Graph.</p>
          ) : (
            <>
              {visibleServices.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`${styles.topologyNode} ${isSelected ? styles.topologyNodeSelected : ""}`}
                    data-kind={node.kind}
                    aria-pressed={isSelected}
                    onClick={() => onSelectNode(node.id)}
                  >
                    {node.label}
                  </button>
                );
              })}
              {hiddenServiceCount > 0 ? (
                <p className={styles.emptyControls}>+{hiddenServiceCount} weitere Services</p>
              ) : null}
            </>
          )}
        </TierColumn>

        <span className={styles.topologyArrow} aria-hidden="true">
          ──►
        </span>

        <TierColumn title="Datenbank">
          {databases.length === 0 ? (
            <p className={styles.emptyControls}>Keine Datenbank-Knoten.</p>
          ) : (
            <>
              {visibleDatabases.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`${styles.topologyNode} ${isSelected ? styles.topologyNodeSelected : ""}`}
                    data-kind={node.kind}
                    aria-pressed={isSelected}
                    onClick={() => onSelectNode(node.id)}
                  >
                    {node.label}
                  </button>
                );
              })}
              {hiddenDatabaseCount > 0 ? (
                <p className={styles.emptyControls}>+{hiddenDatabaseCount} weitere Datenbanken</p>
              ) : null}
            </>
          )}
        </TierColumn>
      </div>
    </div>
  );
}
