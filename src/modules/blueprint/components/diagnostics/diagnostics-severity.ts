/**
 * German severity labels and StatusBadge variants for Diagnostics findings.
 */

import type { BlueprintFinding } from "../../types";
import type { StatusBadgeVariant } from "../ui/StatusBadge.js";

export const SEVERITY_LABELS: Record<BlueprintFinding["severity"], string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
  info: "Info",
};

export function severityBadgeVariant(severity: BlueprintFinding["severity"]): StatusBadgeVariant {
  if (severity === "critical") return "critical";
  if (severity === "high") return "warning";
  if (severity === "medium") return "warning";
  return "unknown";
}
