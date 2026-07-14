/**
 * Accent colors and labels for Blueprint relationship chips (Figma Beziehungstypen).
 * Location: src/modules/blueprint/components/ui/
 */

export const RELATIONSHIP_KINDS = [
  "imports",
  "calls",
  "api",
  "data",
  "event",
  "auth",
  "validation",
  "external",
] as const;

export type RelationshipKind = (typeof RELATIONSHIP_KINDS)[number];

export const RELATIONSHIP_LABELS: Record<RelationshipKind, string> = {
  imports: "Imports",
  calls: "Calls",
  api: "API Calls",
  data: "Database",
  event: "Events",
  auth: "Auth",
  validation: "Validation",
  external: "External Services",
};

export const RELATIONSHIP_CSS_VARS: Record<RelationshipKind, string> = {
  imports: "var(--color-bp-rel-imports)",
  calls: "var(--color-bp-rel-calls)",
  api: "var(--color-bp-rel-api)",
  data: "var(--color-bp-rel-data)",
  event: "var(--color-bp-rel-event)",
  auth: "var(--color-bp-rel-auth)",
  validation: "var(--color-bp-rel-validation)",
  external: "var(--color-bp-rel-external)",
};

export const RELATIONSHIP_SOFT_CSS_VARS: Record<RelationshipKind, string> = {
  imports: "var(--color-bp-rel-imports-soft)",
  calls: "var(--color-bp-rel-calls-soft)",
  api: "var(--color-bp-rel-api-soft)",
  data: "var(--color-bp-rel-data-soft)",
  event: "var(--color-bp-rel-event-soft)",
  auth: "var(--color-bp-rel-auth-soft)",
  validation: "var(--color-bp-rel-validation-soft)",
  external: "var(--color-bp-rel-external-soft)",
};
