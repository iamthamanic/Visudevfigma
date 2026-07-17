/**
 * Access Control Inspector — mechanisms, enforcement layers, evidence, bypass warnings.
 * Why: matrix cells stay stack-agnostic; technology detail (e.g. PostgreSQL RLS) lives here.
 * Location: src/modules/blueprint/components/diagnostics/AccessControlInspector.tsx
 */

import type {
  AccessControlControl,
  AccessControlFinding,
} from "../../../../lib/visudev/access-control-types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import { AccessControlFindingDetail } from "./AccessControlFindingDetail.js";
import { accessControlStatusBadge, CONTROL_LABELS } from "./access-control-inspector-status.js";

interface AccessControlInspectorProps {
  findings: AccessControlFinding[];
  routeId: string | null;
  selectedControl: AccessControlControl | null;
  routeLabel?: string | null;
}

function filterFindings(
  findings: AccessControlFinding[],
  routeId: string | null,
  selectedControl: AccessControlControl | null,
): AccessControlFinding[] {
  if (!Array.isArray(findings)) return [];
  return findings.filter((finding) => {
    if (!finding || typeof finding !== "object") return false;
    if (routeId && finding.resourceId !== routeId) return false;
    if (selectedControl && finding.control !== selectedControl) return false;
    return true;
  });
}

function controlSummary(findings: AccessControlFinding[]): AccessControlControl[] {
  const seen = new Set<AccessControlControl>();
  const order: AccessControlControl[] = [];
  for (const finding of findings) {
    if (!seen.has(finding.control)) {
      seen.add(finding.control);
      order.push(finding.control);
    }
  }
  return order;
}

export function AccessControlInspector({
  findings,
  routeId,
  selectedControl,
  routeLabel,
}: AccessControlInspectorProps): JSX.Element {
  const scoped = filterFindings(findings, routeId, selectedControl);

  if (!routeId && !selectedControl) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Klicke eine Matrix-Zelle, um Mechanismen und Evidence zu sehen."
        testId="access-control-inspector"
      />
    );
  }

  // Route selected but no cell yet: show which controls have findings — not a random detail panel.
  if (routeId && !selectedControl) {
    const routeFindings = filterFindings(findings, routeId, null);
    const controls = controlSummary(routeFindings);
    return (
      <InspectorPanel
        title="Access Control"
        subtitle={routeLabel ?? routeId}
        testId="access-control-inspector"
        sections={[
          {
            id: "prompt",
            title: "Auswahl",
            content: (
              <p data-testid="ac-route-prompt">
                {controls.length === 0
                  ? "Keine Access-Control-Findings für diese Route. Klicke eine Matrix-Zelle für Details."
                  : `Findings für: ${controls.map((c) => CONTROL_LABELS[c]).join(", ")}. Klicke eine Matrix-Zelle für Mechanismen und Evidence.`}
              </p>
            ),
          },
        ]}
      />
    );
  }

  if (scoped.length === 0) {
    return (
      <InspectorPanel
        title={selectedControl ? CONTROL_LABELS[selectedControl] : "Access Control"}
        subtitle={routeLabel ?? routeId ?? undefined}
        emptyMessage="Keine Access-Control-Findings für diese Auswahl."
        testId="access-control-inspector"
      />
    );
  }

  const primary = scoped[0];
  const badge = accessControlStatusBadge(primary.status);

  return (
    <InspectorPanel
      title={CONTROL_LABELS[primary.control] ?? primary.control}
      subtitle={routeLabel ?? primary.resourceId}
      badges={<StatusBadge variant={badge.variant} label={badge.label} />}
      testId="access-control-inspector"
    >
      {scoped.map((finding, index) => (
        <AccessControlFindingDetail
          key={finding.id}
          finding={finding}
          showIndex={scoped.length > 1}
          index={index}
        />
      ))}
    </InspectorPanel>
  );
}
