/**
 * Mock data for VisuDEV – alle Daten entfernt (keine Demo-/Scriptony-Projekte mehr).
 * Exporte bleiben für Kompatibilität; Inhalt ist leer.
 */
import type {
  FlowNode,
  FlowEdge,
  UIElement,
  DBTable,
  DBRelation,
  DBPolicy,
  Migration,
  WebhookEvent,
  Project,
} from "./types";

export const mockProject: Project = {
  id: "",
  name: "",
};

export const mockUIElements: UIElement[] = [];
export const mockFlowNodes: FlowNode[] = [];
export const mockFlowEdges: FlowEdge[] = [];
export const mockTables: DBTable[] = [];
export const mockRelations: DBRelation[] = [];
export const mockPolicies: DBPolicy[] = [];
export const mockMigrations: Migration[] = [];
export const mockWebhookEvents: WebhookEvent[] = [];
