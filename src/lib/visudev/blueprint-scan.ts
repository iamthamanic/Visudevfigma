/**
 * Blueprint scan orchestration — analyzer call + KV persist (decoupled from store UI state).
 * Location: src/lib/visudev/blueprint-scan.ts
 */

import { blueprintAPI } from "../../utils/api";
import { analyzeBlueprintViaRunner } from "./blueprint-runner-client";
import { normalizeBlueprintData } from "./normalize-blueprint";
import { getProjectSourceMode } from "./project-source";
import type { Project } from "./types";

export class BlueprintScanError extends Error {
  constructor(
    message: string,
    readonly code:
      | "missing_repo"
      | "missing_local_path"
      | "runner_unreachable"
      | "analyzer"
      | "persist"
      | "empty_response",
  ) {
    super(message);
    this.name = "BlueprintScanError";
  }
}

export interface BlueprintScanResult {
  blueprint: Record<string, unknown>;
  analysisId: string;
  routeCount: number;
  findingCount: number;
}

async function persistBlueprint(
  project: Project,
  blueprintDocument: Record<string, unknown>,
  analysisId: string,
): Promise<BlueprintScanResult> {
  const routeCount = Array.isArray(blueprintDocument.routes) ? blueprintDocument.routes.length : 0;
  const findingCount = Array.isArray(blueprintDocument.findings)
    ? blueprintDocument.findings.length
    : 0;

  const saveResponse = await blueprintAPI.update(project.id, {
    ...blueprintDocument,
    projectId: project.id,
  });

  if (!saveResponse.success) {
    throw new BlueprintScanError(
      saveResponse.error || "Blueprint konnte nicht gespeichert werden.",
      "persist",
    );
  }

  return {
    blueprint: blueprintDocument,
    analysisId,
    routeCount,
    findingCount,
  };
}

export async function runBlueprintScan(
  project: Project,
  accessToken?: string | null,
): Promise<BlueprintScanResult> {
  const sourceMode = getProjectSourceMode(project);

  if (sourceMode === "local") {
    const localPath = project.local_path?.trim();
    if (!localPath) {
      throw new BlueprintScanError(
        "Kein lokaler Projektpfad konfiguriert. Bitte absoluten Ordner im Projekt hinterlegen.",
        "missing_local_path",
      );
    }

    const analyzeResponse = await analyzeBlueprintViaRunner({
      projectId: project.id,
      localPath,
    });

    if (!analyzeResponse.success || !analyzeResponse.data?.blueprint) {
      const message = analyzeResponse.error || "Lokale Blueprint-Analyse fehlgeschlagen";
      throw new BlueprintScanError(
        message,
        message.includes("nicht erreichbar") ? "runner_unreachable" : "empty_response",
      );
    }

    const blueprintDocument = normalizeBlueprintData(
      analyzeResponse.data.blueprint as Record<string, unknown>,
    );

    return persistBlueprint(project, blueprintDocument, analyzeResponse.data.analysisId);
  }

  const githubRepo = project.github_repo?.trim();
  if (!githubRepo) {
    throw new BlueprintScanError(
      "Kein GitHub-Repository konfiguriert. Bitte Repo im Projekt hinterlegen oder lokalen Ordner wählen.",
      "missing_repo",
    );
  }

  const analyzeResponse = await blueprintAPI.analyze(
    {
      repo: githubRepo,
      branch: project.github_branch?.trim() || "main",
      projectId: project.id,
    },
    accessToken,
  );

  if (!analyzeResponse.success || !analyzeResponse.data?.blueprint) {
    throw new BlueprintScanError(
      analyzeResponse.error || "Blueprint analyzer returned no data",
      analyzeResponse.error?.includes("Repository") ? "missing_repo" : "empty_response",
    );
  }

  const blueprintDocument = normalizeBlueprintData(
    analyzeResponse.data.blueprint as Record<string, unknown>,
  );

  return persistBlueprint(project, blueprintDocument, analyzeResponse.data.analysisId);
}
