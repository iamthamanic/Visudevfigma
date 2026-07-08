import type { ProjectMigrationMetadata } from "./project-migration.types";

export function stripSecretFields(record: Record<string, unknown>): Record<string, unknown>;
export function supabaseRecordToMetadata(
  project: Record<string, unknown>,
): ProjectMigrationMetadata;
export function localRecordToMetadata(project: Record<string, unknown>): ProjectMigrationMetadata;
export function metadataToSupabaseCreateBody(
  metadata: ProjectMigrationMetadata,
): Record<string, unknown>;
export function metadataToLocalCreateInput(metadata: ProjectMigrationMetadata): {
  name: string;
  repositoryUrl?: string;
  localPath?: string;
};
export function unwrapSupabaseApiPayload(payload: unknown): unknown;
