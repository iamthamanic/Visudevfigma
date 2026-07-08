/**
 * Migration routes for Supabase ↔ local project bundles.
 * Location: local-engine/src/routes/migration.routes.ts
 */

import type { Hono } from "hono";
import type { MigrationService } from "../services/migration.service.js";
import type {
  ExportSupabaseProjectInput,
  ImportLocalBundleInput,
  ImportSupabaseBundleInput,
  ProjectMigrationBundle,
} from "../types/api.types.js";
import { fail, getErrorStatus, ok } from "./http.js";

export function registerMigrationRoutes(app: Hono, migrationService: MigrationService): void {
  app.post("/api/migration/export/supabase", async (c) => {
    try {
      const body = (await c.req.json()) as ExportSupabaseProjectInput;
      if (!body?.supabaseUrl?.trim() || !body?.projectId?.trim()) {
        return fail(c, "VALIDATION_ERROR", "supabaseUrl and projectId are required", 400);
      }
      const result = await migrationService.exportFromSupabase(body);
      return ok(c, result);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "MIGRATION_EXPORT_FAILED";
      return fail(
        c,
        code,
        error instanceof Error ? error.message : "Failed to export Supabase project",
        getErrorStatus(error, 500),
      );
    }
  });

  app.get("/api/migration/export/local/:projectId", async (c) => {
    try {
      const result = await migrationService.exportLocalProject(c.req.param("projectId"));
      return ok(c, result);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "MIGRATION_EXPORT_FAILED";
      return fail(
        c,
        code,
        error instanceof Error ? error.message : "Failed to export local project",
        getErrorStatus(error, 404),
      );
    }
  });

  app.post("/api/migration/import/local", async (c) => {
    try {
      const body = (await c.req.json()) as ImportLocalBundleInput;
      if (!body?.bundle || body.bundle.version !== 1) {
        return fail(c, "VALIDATION_ERROR", "bundle version 1 is required", 400);
      }
      const result = await migrationService.importToLocal(body);
      return ok(c, result, 201);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "MIGRATION_IMPORT_FAILED";
      return fail(
        c,
        code,
        error instanceof Error ? error.message : "Failed to import project to local storage",
        getErrorStatus(error, 500),
      );
    }
  });

  app.post("/api/migration/import/supabase", async (c) => {
    try {
      const body = (await c.req.json()) as ImportSupabaseBundleInput;
      if (!body?.bundle || body.bundle.version !== 1) {
        return fail(c, "VALIDATION_ERROR", "bundle version 1 is required", 400);
      }
      if (!body.supabaseUrl?.trim() || !body.accessToken?.trim()) {
        return fail(c, "VALIDATION_ERROR", "supabaseUrl and accessToken are required", 400);
      }
      const result = await migrationService.importToSupabase(body);
      return ok(c, result, 201);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "MIGRATION_IMPORT_FAILED";
      return fail(
        c,
        code,
        error instanceof Error ? error.message : "Failed to import project to Supabase",
        getErrorStatus(error, 500),
      );
    }
  });

  app.post("/api/migration/validate", async (c) => {
    const body = (await c.req.json()) as { bundle?: ProjectMigrationBundle };
    if (!body?.bundle || body.bundle.version !== 1 || !body.bundle.project?.name) {
      return fail(c, "VALIDATION_ERROR", "Invalid migration bundle", 400);
    }
    return ok(c, { valid: true, source: body.bundle.source, exportedAt: body.bundle.exportedAt });
  });
}
