/**
 * Verifies JWT ownership and repo match before expensive blueprint analysis.
 */

import type { Context } from "hono";
import type {
  LoggerLike,
  SupabaseClientLike,
} from "../../interfaces/module.interface.ts";
import type { BlueprintAnalysisRequestDto } from "../../dto/blueprint/blueprint-document.dto.ts";
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from "../../internal/exceptions/index.ts";
import { getUserIdOptional } from "../../internal/helpers/auth-helper.ts";

interface StoredProject {
  id: string;
  ownerId?: string;
  github_repo?: string;
  github_branch?: string;
}

export class BlueprintProjectAccessService {
  constructor(
    private readonly supabase: SupabaseClientLike,
    private readonly kvTableName: string,
    private readonly logger: LoggerLike,
  ) {}

  public async assertCanAnalyze(
    c: Context,
    body: BlueprintAnalysisRequestDto,
  ): Promise<void> {
    const projectId = body.projectId.trim();
    const userId = await getUserIdOptional(c);
    if (userId === null) {
      throw new ForbiddenException("Not authorized to analyze this project");
    }

    const project = await this.loadProject(projectId);
    if (!project) {
      throw new NotFoundException("Project");
    }

    if (project.ownerId != null && project.ownerId !== userId) {
      throw new ForbiddenException("Not authorized to analyze this project");
    }

    const configuredRepo = project.github_repo?.trim();
    const requestedRepo = body.repo.trim();
    if (configuredRepo && configuredRepo !== requestedRepo) {
      throw new ValidationException(
        "repo does not match the configured project repository",
        [{ field: "repo", message: "Must match project.github_repo" }],
      );
    }
  }

  private async loadProject(projectId: string): Promise<StoredProject | null> {
    const key = `project:${projectId}`;
    const { data, error } = await this.supabase
      .from(this.kvTableName)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      this.logger.error("Blueprint project KV read failed", {
        projectId,
        error: error.message,
      });
      throw new NotFoundException("Project");
    }

    return (data?.value as StoredProject | null) ?? null;
  }
}
