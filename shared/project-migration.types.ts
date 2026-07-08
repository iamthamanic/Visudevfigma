/**
 * Shared project migration types (Supabase KV ↔ ~/.visudev).
 * Location: shared/project-migration.types.ts
 */

export type ProjectMigrationBundleVersion = 1;

export type ProjectMigrationSource = "supabase" | "local";

export type ProjectMigrationArtifacts = {
  blueprint?: Record<string, unknown>;
  appflow?: {
    screens?: unknown[];
    flows?: unknown[];
    graph?: unknown;
    quality?: unknown;
    runtime?: unknown;
  };
  erd?: Record<string, unknown>;
};

export type ProjectMigrationMetadata = {
  name: string;
  description?: string;
  sourceMode?: "github" | "local";
  localPath?: string;
  repositoryUrl?: string;
  githubRepo?: string;
  githubBranch?: string;
  previewMode?: string;
  databaseType?: string;
  supabaseProjectId?: string;
  deployedUrl?: string;
  originalProjectId?: string;
};

export type ProjectMigrationBundle = {
  version: ProjectMigrationBundleVersion;
  exportedAt: string;
  source: ProjectMigrationSource;
  project: ProjectMigrationMetadata;
  artifacts?: ProjectMigrationArtifacts;
};

export type ExportSupabaseProjectInput = {
  supabaseUrl: string;
  projectId: string;
  accessToken?: string;
  anonKey?: string;
};

export type ImportLocalBundleInput = {
  bundle: ProjectMigrationBundle;
  preserveProjectId?: boolean;
};

export type ImportSupabaseBundleInput = {
  bundle: ProjectMigrationBundle;
  supabaseUrl: string;
  accessToken: string;
};

export type MigrationResult = {
  projectId: string;
  bundle?: ProjectMigrationBundle;
  importedArtifacts?: string[];
};
