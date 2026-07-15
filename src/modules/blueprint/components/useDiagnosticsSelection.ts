/**
 * Route/finding selection state for DiagnosticsView.
 */

import { useEffect, useMemo, useState } from "react";
import { buildGraphSnapshotKey } from "../services/graph-snapshot-key.js";
import { useDiagnosticsDefaultFindingSelection } from "../hooks/useDiagnosticsDefaultFindingSelection.js";
import type { BlueprintData, BlueprintFinding, RouteBlueprint } from "../types";

export function useDiagnosticsSelection(blueprint: BlueprintData) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const diagnosticsSnapshotKey = buildGraphSnapshotKey(blueprint.graph);

  const routes = useMemo(() => blueprint.routes ?? [], [blueprint.routes]);
  const matrix = useMemo(() => blueprint.securityMatrix ?? [], [blueprint.securityMatrix]);
  const allFindings = useMemo(() => blueprint.findings ?? [], [blueprint.findings]);
  const facts = useMemo(() => blueprint.facts ?? [], [blueprint.facts]);

  const selectedRoute: RouteBlueprint | null = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  // Zielbild shows the full findings list (paginated ~24). Route selection still
  // drives matrix highlight / route canvas; do not collapse findings to one route.
  const routeFindings: BlueprintFinding[] = useMemo(() => allFindings, [allFindings]);

  useEffect(() => {
    if (routes.length === 0) {
      setSelectedRouteId(null);
      return;
    }
    if (!selectedRouteId || !routes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  useDiagnosticsDefaultFindingSelection(
    allFindings,
    selectedFindingId,
    setSelectedFindingId,
    diagnosticsSnapshotKey,
  );

  const selectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedFindingId(null);
  };

  return {
    routes,
    matrix,
    facts,
    selectedRouteId,
    selectedRoute,
    routeFindings,
    selectedFindingId,
    setSelectedFindingId,
    selectRoute,
  };
}
