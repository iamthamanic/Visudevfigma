/**
 * Sanitize and map project records for Supabase ↔ local migration.
 * Location: shared/project-migration.mjs
 */

/** @typedef {import("./project-migration.types.ts").ProjectMigrationBundle} ProjectMigrationBundle */
/** @typedef {import("./project-migration.types.ts").ProjectMigrationMetadata} ProjectMigrationMetadata */

const SECRET_KEYS = [
  "github_access_token",
  "supabase_anon_key",
  "supabase_management_token",
  "accessToken",
  "serviceKey",
  "token",
];

const INTEGRATION_SECRET_PATHS = ["github.token", "supabase.serviceKey"];

/**
 * @param {Record<string, unknown>} record
 * @returns {Record<string, unknown>}
 */
export function stripSecretFields(record) {
  if (!record || typeof record !== "object") return {};
  const next = { ...record };
  for (const key of SECRET_KEYS) {
    if (key in next) delete next[key];
  }
  if (next.integrations && typeof next.integrations === "object") {
    const integrations = { .../** @type {Record<string, unknown>} */ (next.integrations) };
    if (integrations.github && typeof integrations.github === "object") {
      const github = { .../** @type {Record<string, unknown>} */ (integrations.github) };
      delete github.token;
      integrations.github = github;
    }
    if (integrations.supabase && typeof integrations.supabase === "object") {
      const supabase = { .../** @type {Record<string, unknown>} */ (integrations.supabase) };
      delete supabase.serviceKey;
      integrations.supabase = supabase;
    }
    next.integrations = integrations;
  }
  return next;
}

/**
 * @param {Record<string, unknown>} project
 * @returns {ProjectMigrationMetadata}
 */
export function supabaseRecordToMetadata(project) {
  const clean = stripSecretFields(project);
  const githubRepo =
    typeof clean.github_repo === "string"
      ? clean.github_repo
      : typeof clean.repositoryUrl === "string"
        ? clean.repositoryUrl
        : undefined;
  const localPath =
    typeof clean.local_path === "string"
      ? clean.local_path
      : typeof clean.localPath === "string"
        ? clean.localPath
        : undefined;
  return {
    name: typeof clean.name === "string" ? clean.name : "Imported project",
    description: typeof clean.description === "string" ? clean.description : undefined,
    sourceMode: localPath ? "local" : githubRepo ? "github" : undefined,
    localPath,
    repositoryUrl: githubRepo,
    githubRepo,
    githubBranch: typeof clean.github_branch === "string" ? clean.github_branch : undefined,
    previewMode: typeof clean.preview_mode === "string" ? clean.preview_mode : undefined,
    databaseType: typeof clean.database_type === "string" ? clean.database_type : undefined,
    supabaseProjectId:
      typeof clean.supabase_project_id === "string" ? clean.supabase_project_id : undefined,
    deployedUrl: typeof clean.deployed_url === "string" ? clean.deployed_url : undefined,
    originalProjectId: typeof clean.id === "string" ? clean.id : undefined,
  };
}

/**
 * @param {Record<string, unknown>} project
 * @returns {ProjectMigrationMetadata}
 */
export function localRecordToMetadata(project) {
  const clean = stripSecretFields(project);
  return {
    name: typeof clean.name === "string" ? clean.name : "Local project",
    description: typeof clean.description === "string" ? clean.description : undefined,
    sourceMode: clean.localPath ? "local" : clean.repositoryUrl ? "github" : undefined,
    localPath: typeof clean.localPath === "string" ? clean.localPath : undefined,
    repositoryUrl: typeof clean.repositoryUrl === "string" ? clean.repositoryUrl : undefined,
    githubRepo: typeof clean.repositoryUrl === "string" ? clean.repositoryUrl : undefined,
    previewMode: typeof clean.preview?.status === "string" ? "local" : undefined,
    originalProjectId: typeof clean.id === "string" ? clean.id : undefined,
  };
}

/**
 * @param {ProjectMigrationMetadata} metadata
 * @returns {Record<string, unknown>}
 */
export function metadataToSupabaseCreateBody(metadata) {
  return stripSecretFields({
    name: metadata.name,
    description: metadata.description,
    local_path: metadata.localPath,
    github_repo: metadata.githubRepo ?? metadata.repositoryUrl,
    github_branch: metadata.githubBranch,
    preview_mode: metadata.previewMode,
    database_type: metadata.databaseType,
    supabase_project_id: metadata.supabaseProjectId,
    deployed_url: metadata.deployedUrl,
  });
}

/**
 * @param {ProjectMigrationMetadata} metadata
 * @returns {{ name: string, repositoryUrl?: string, localPath?: string }}
 */
export function metadataToLocalCreateInput(metadata) {
  return {
    name: metadata.name,
    repositoryUrl: metadata.repositoryUrl ?? metadata.githubRepo,
    localPath: metadata.localPath,
  };
}

/**
 * @param {unknown} payload
 * @returns {unknown}
 */
export function unwrapSupabaseApiPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const record = /** @type {Record<string, unknown>} */ (payload);
  if (record.ok === true && "data" in record) return record.data;
  if (record.success === true && "data" in record) return record.data;
  return null;
}

export { INTEGRATION_SECRET_PATHS };
