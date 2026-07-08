/**
 * Project migration between Supabase KV and ~/.visudev storage.
 * Location: local-engine/src/services/migration.service.ts
 */

import path from "node:path";
import {
  localRecordToMetadata,
  metadataToLocalCreateInput,
  metadataToSupabaseCreateBody,
  stripSecretFields,
  supabaseRecordToMetadata,
  unwrapSupabaseApiPayload,
} from "../lib/project-migration.js";
import { ensureVisuDevDir, readJsonFile, writeJsonFile } from "../storage/file-store.js";
import type { ProjectService } from "./project.service.js";
import type {
  ExportSupabaseProjectInput,
  ImportLocalBundleInput,
  ImportSupabaseBundleInput,
  LocalAppflowLatest,
  LocalBlueprintLatest,
  LocalDataLatest,
  MigrationResult,
  ProjectMigrationBundle,
} from "../types/api.types.js";

type SupabaseFetchConfig = {
  supabaseUrl: string;
  accessToken?: string;
  anonKey?: string;
};

async function supabaseFetchJson(
  config: SupabaseFetchConfig,
  endpoint: string,
  init?: RequestInit,
): Promise<unknown> {
  const token = config.accessToken?.trim() || config.anonKey?.trim();
  if (!token) {
    throw Object.assign(new Error("Supabase accessToken or anonKey is required."), {
      statusCode: 400,
      code: "SUPABASE_AUTH_REQUIRED",
    });
  }

  const base = config.supabaseUrl.replace(/\/$/, "");
  const url = `${base}/functions/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw Object.assign(new Error("Supabase API returned invalid JSON."), {
      statusCode: 502,
      code: "SUPABASE_INVALID_JSON",
    });
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? String((payload as { error: string }).error)
        : `Supabase request failed (${response.status})`;
    throw Object.assign(new Error(message), {
      statusCode: response.status,
      code: "SUPABASE_REQUEST_FAILED",
    });
  }

  return unwrapSupabaseApiPayload(payload);
}

export class MigrationService {
  constructor(
    private readonly storageDir: string,
    private readonly projectService: ProjectService,
  ) {}

  private projectDir(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId);
  }

  private blueprintCachePath(projectId: string): string {
    return path.join(this.projectDir(projectId), "blueprint.json");
  }

  private appflowCachePath(projectId: string): string {
    return path.join(this.projectDir(projectId), "appflow.json");
  }

  private erdCachePath(projectId: string): string {
    return path.join(this.projectDir(projectId), "erd.json");
  }

  private runtimeCachePath(projectId: string): string {
    return path.join(this.projectDir(projectId), "runtime-crawl.json");
  }

  async exportFromSupabase(input: ExportSupabaseProjectInput): Promise<MigrationResult> {
    const config: SupabaseFetchConfig = {
      supabaseUrl: input.supabaseUrl,
      accessToken: input.accessToken,
      anonKey: input.anonKey,
    };

    const projectRecord = await supabaseFetchJson(config, `/visudev-projects/${input.projectId}`);
    if (!projectRecord || typeof projectRecord !== "object") {
      throw Object.assign(new Error("Supabase project not found."), {
        statusCode: 404,
        code: "PROJECT_NOT_FOUND",
      });
    }

    const cleanProject = stripSecretFields(projectRecord as Record<string, unknown>) as Record<
      string,
      unknown
    >;
    const blueprint = await supabaseFetchJson(
      config,
      `/visudev-blueprint/${input.projectId}`,
    ).catch(() => null);
    const erd = await supabaseFetchJson(config, `/visudev-data/${input.projectId}/erd`).catch(
      () => null,
    );

    const bundle: ProjectMigrationBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: "supabase",
      project: supabaseRecordToMetadata(cleanProject),
      artifacts: {
        blueprint:
          blueprint && typeof blueprint === "object"
            ? (stripSecretFields(blueprint as Record<string, unknown>) as Record<string, unknown>)
            : undefined,
        appflow: {
          screens: Array.isArray(cleanProject.screens) ? cleanProject.screens : [],
          flows: Array.isArray(cleanProject.flows) ? cleanProject.flows : [],
          graph: cleanProject.analysisGraph,
          quality: cleanProject.analysisQuality,
          runtime: cleanProject.analysisRuntime,
        },
        erd:
          erd && typeof erd === "object"
            ? (stripSecretFields(erd as Record<string, unknown>) as Record<string, unknown>)
            : undefined,
      },
    };

    return { projectId: input.projectId, bundle };
  }

  async exportLocalProject(projectId: string): Promise<MigrationResult> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Local project not found."), {
        statusCode: 404,
        code: "PROJECT_NOT_FOUND",
      });
    }

    const blueprint = await readJsonFile<LocalBlueprintLatest | null>(
      this.blueprintCachePath(projectId),
      null,
    );
    const appflow = await readJsonFile<LocalAppflowLatest | null>(
      this.appflowCachePath(projectId),
      null,
    );
    const erd = await readJsonFile<LocalDataLatest | null>(this.erdCachePath(projectId), null);
    const runtime = await readJsonFile<{ runtime?: unknown } | null>(
      this.runtimeCachePath(projectId),
      null,
    );

    const bundle: ProjectMigrationBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: "local",
      project: localRecordToMetadata(project as unknown as Record<string, unknown>),
      artifacts: {
        blueprint: blueprint?.blueprint as Record<string, unknown> | undefined,
        appflow: appflow
          ? {
              screens: appflow.screens,
              flows: appflow.flows,
              graph: appflow.graph,
              quality: appflow.quality,
              runtime: runtime?.runtime ?? appflow.runtime,
            }
          : undefined,
        erd: erd
          ? {
              projectId: erd.projectId,
              updatedAt: erd.updatedAt,
              nodes: erd.nodes,
              tables: erd.tables,
              message: erd.message,
            }
          : undefined,
      },
    };

    return { projectId, bundle };
  }

  async importToLocal(input: ImportLocalBundleInput): Promise<MigrationResult> {
    if (input.bundle.version !== 1) {
      throw Object.assign(new Error("Unsupported migration bundle version."), {
        statusCode: 400,
        code: "BUNDLE_VERSION_UNSUPPORTED",
      });
    }

    const createInput = metadataToLocalCreateInput(input.bundle.project);
    const created = await this.projectService.createProject(createInput);
    const projectId = created.id;

    const importedArtifacts: string[] = [];
    await ensureVisuDevDir(this.projectDir(projectId));

    const blueprint = input.bundle.artifacts?.blueprint;
    if (blueprint) {
      const updatedAt = new Date().toISOString();
      await writeJsonFile(this.blueprintCachePath(projectId), {
        projectId,
        runId: `import_${Date.now()}`,
        blueprint,
        updatedAt,
      } satisfies LocalBlueprintLatest);
      importedArtifacts.push("blueprint");
    }

    const appflow = input.bundle.artifacts?.appflow;
    if (appflow && (appflow.screens?.length || appflow.flows?.length)) {
      const updatedAt = new Date().toISOString();
      await writeJsonFile(this.appflowCachePath(projectId), {
        projectId,
        runId: `import_${Date.now()}`,
        screens: appflow.screens ?? [],
        flows: appflow.flows ?? [],
        graph: appflow.graph,
        quality: appflow.quality,
        runtime: appflow.runtime,
        updatedAt,
      } satisfies LocalAppflowLatest);
      importedArtifacts.push("appflow");
    }

    const erd = input.bundle.artifacts?.erd;
    if (erd) {
      const updatedAt = new Date().toISOString();
      await writeJsonFile(this.erdCachePath(projectId), {
        projectId,
        runId: `import_${Date.now()}`,
        nodes: (erd.nodes as unknown[]) ?? (erd.tables as unknown[]) ?? [],
        tables: (erd.tables as unknown[]) ?? (erd.nodes as unknown[]) ?? [],
        message: typeof erd.message === "string" ? erd.message : undefined,
        updatedAt,
      } satisfies LocalDataLatest);
      importedArtifacts.push("erd");
    }

    return { projectId, importedArtifacts };
  }

  async importToSupabase(input: ImportSupabaseBundleInput): Promise<MigrationResult> {
    if (input.bundle.version !== 1) {
      throw Object.assign(new Error("Unsupported migration bundle version."), {
        statusCode: 400,
        code: "BUNDLE_VERSION_UNSUPPORTED",
      });
    }

    const config: SupabaseFetchConfig = {
      supabaseUrl: input.supabaseUrl,
      accessToken: input.accessToken,
    };

    const createBody = metadataToSupabaseCreateBody(input.bundle.project);
    const created = await supabaseFetchJson(config, "/visudev-projects", {
      method: "POST",
      body: JSON.stringify(createBody),
    });

    if (
      !created ||
      typeof created !== "object" ||
      typeof (created as { id?: unknown }).id !== "string"
    ) {
      throw Object.assign(new Error("Supabase project create did not return an id."), {
        statusCode: 502,
        code: "SUPABASE_CREATE_INVALID",
      });
    }

    const projectId = String((created as { id: string }).id);
    const importedArtifacts: string[] = ["project"];

    const appflow = input.bundle.artifacts?.appflow;
    if (appflow && (appflow.screens?.length || appflow.flows?.length)) {
      await supabaseFetchJson(config, `/visudev-projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(
          stripSecretFields({
            screens: appflow.screens ?? [],
            flows: appflow.flows ?? [],
            analysisGraph: appflow.graph,
            analysisQuality: appflow.quality,
            analysisRuntime: appflow.runtime,
          }),
        ),
      });
      importedArtifacts.push("appflow");
    }

    const blueprint = input.bundle.artifacts?.blueprint;
    if (blueprint) {
      await supabaseFetchJson(config, `/visudev-blueprint/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(blueprint),
      });
      importedArtifacts.push("blueprint");
    }

    const erd = input.bundle.artifacts?.erd;
    if (erd) {
      await supabaseFetchJson(config, `/visudev-data/${projectId}/erd`, {
        method: "PUT",
        body: JSON.stringify(erd),
      });
      importedArtifacts.push("erd");
    }

    return { projectId, importedArtifacts };
  }
}
