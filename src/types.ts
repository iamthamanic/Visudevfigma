// Core domain types for VisuDEV

export type NodeKind = 'ui' | 'api' | 'edge' | 'auth' | 'sql' | 'policy' | 'storage' | 'erp';
export type EdgeKind = 'import' | 'request' | 'sql' | 'policy' | 'relation' | 'deploy';
export type Layer = 'frontend' | 'compute' | 'data' | 'external' | 'policies';
export type MemberRole = 'owner' | 'maintainer' | 'viewer';

export interface NodeMetrics {
  avg_ms?: number;
  p95_ms?: number;
  err_rate?: number;
}

export interface NodeLinks {
  github_permalink: string;
  open_in_supabase?: string;
}

export interface FlowNode {
  id: string;
  kind: NodeKind;
  title: string;
  file_path?: string;
  start_line?: number;
  end_line?: number;
  commit_sha?: string;
  description: string;
  code_snippet?: string;
  metrics?: NodeMetrics;
  links: NodeLinks;
  layer: Layer;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
}

export interface UIElement {
  id: string;
  selector: string;
  screenId: string;
  entryStep: string;
  label: string;
}

export interface DBTable {
  id: string;
  schema_name: string;
  table_name: string;
  columns?: string[];
}

export interface DBRelation {
  id: string;
  src_table: string;
  src_column: string;
  dst_table: string;
  dst_column: string;
}

export interface DBPolicy {
  id: string;
  table_name: string;
  policy_name: string;
  roles: string[];
  using_sql: string;
  check_sql?: string;
}

export interface Migration {
  id: string;
  name: string;
  sha?: string;
  applied_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event: string;
  delivery_id: string;
  received_at: string;
  payload: any;
}

export interface Repo {
  id: string;
  owner: string;
  name: string;
  default_branch: string;
}

export interface Project {
  id: string;
  name: string;
  repo?: Repo;
}
