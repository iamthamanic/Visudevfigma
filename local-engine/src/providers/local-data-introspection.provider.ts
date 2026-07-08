/**
 * Local Data / ERD analysis via direct schema introspection (PostgreSQL or SQLite).
 * Location: local-engine/src/providers/local-data-introspection.provider.ts
 */

import type { AnalysisProvider, AnalyzeProjectInput } from "./analysis-provider.js";
import type { LocalEngineAnalysisResult } from "../types/api.types.js";
import {
  introspectDatabaseFromProjectRoot,
  type DataIntrospectionResult,
} from "../services/data-introspection.service.js";
import { resolveDatabaseConfig } from "../lib/resolve-database-config.js";

export class LocalDataIntrospectionProvider implements AnalysisProvider {
  readonly id = "local-data-introspection";
  readonly name = "Local Data Introspection";

  async analyzeProject(input: AnalyzeProjectInput): Promise<LocalEngineAnalysisResult> {
    const localPath = input.localPath ?? input.project.localPath;
    if (!localPath) {
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "MISSING_LOCAL_PATH",
          message: "Data analysis requires a local project path to read .env database settings.",
        },
      };
    }

    const config = resolveDatabaseConfig(localPath);
    if (config.kind === "none") {
      const empty: DataIntrospectionResult = {
        nodes: [],
        tables: [],
        message: config.message,
      };
      return this.toSuccessResult(input.projectId, empty);
    }

    try {
      const result = await introspectDatabaseFromProjectRoot(localPath);
      return this.toSuccessResult(input.projectId, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "DATA_INTROSPECTION_FAILED",
          message,
        },
      };
    }
  }

  private toSuccessResult(projectId: string, result: DataIntrospectionResult) {
    return {
      kind: "data" as const,
      projectId,
      runId: "",
      providerId: "local-data-introspection" as const,
      status: "success" as const,
      createdAt: new Date().toISOString(),
      summary: {
        tablesDetected: result.nodes.length,
        columnsDetected: result.nodes.reduce(
          (count, table) => count + (table.columns?.length ?? 0),
          0,
        ),
        warnings: result.message ? 1 : 0,
        errors: 0,
      },
      erd: {
        projectId,
        updatedAt: new Date().toISOString(),
        nodes: result.nodes,
        tables: result.tables,
        message: result.message,
        dialect: result.dialect,
        source: result.source,
      },
      raw: {
        dialect: result.dialect,
        source: result.source,
      },
    };
  }
}
