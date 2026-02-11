import type { Context } from "hono";
import { ZodError } from "zod";
import type {
  CreateProjectDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from "../dto/index.ts";
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from "../internal/exceptions/index.ts";
import { getUserIdOptional } from "../internal/helpers/auth-helper.ts";
import { ProjectsService } from "../services/projects.service.ts";
import {
  createProjectBodySchema,
  projectIdSchema,
  updateProjectBodySchema,
} from "../validators/project.validator.ts";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  /** IDOR: when JWT present, filter to owned projects only. */
  public async listProjects(c: Context): Promise<Response> {
    const userId = await getUserIdOptional(c);
    const data = await this.service.listProjects(userId);
    return this.ok<ProjectResponseDto[]>(c, data);
  }

  /** IDOR: require auth; require ownership when project has ownerId. */
  public async getProject(c: Context): Promise<Response> {
    const id = this.parseProjectId(c);
    const project = await this.service.getProject(id);
    if (!project) {
      throw new NotFoundException("Project");
    }
    const userId = await getUserIdOptional(c);
    if (userId === null) {
      throw new ForbiddenException("Not authorized to access this project");
    }
    const ownerId =
      (project as ProjectResponseDto & { ownerId?: string }).ownerId;
    if (ownerId != null && userId !== ownerId) {
      throw new ForbiddenException("Not authorized to access this project");
    }
    return this.ok<ProjectResponseDto>(c, project);
  }

  /** Set ownerId from JWT when present (IDOR mitigation). */
  public async createProject(c: Context): Promise<Response> {
    const body = await this.parseBody<CreateProjectDto>(
      c,
      createProjectBodySchema,
    );
    const userId = await getUserIdOptional(c);
    const payload = { ...body, ownerId: userId ?? undefined };
    const id = this.extractId(body);
    const project = await this.service.createProject(id, payload);
    return this.ok<ProjectResponseDto>(c, project);
  }

  /** IDOR: require auth; require ownership when project has ownerId. */
  public async updateProject(c: Context): Promise<Response> {
    const id = this.parseProjectId(c);
    const project = await this.service.getProject(id);
    if (!project) {
      throw new NotFoundException("Project");
    }
    const userId = await getUserIdOptional(c);
    if (userId === null) {
      throw new ForbiddenException("Not authorized to access this project");
    }
    const ownerId =
      (project as ProjectResponseDto & { ownerId?: string }).ownerId;
    if (ownerId != null && userId !== ownerId) {
      throw new ForbiddenException("Not authorized to access this project");
    }
    const body = await this.parseBody<UpdateProjectDto>(
      c,
      updateProjectBodySchema,
    );
    const { ownerId: _omit, ...safeBody } = body as UpdateProjectDto & {
      ownerId?: string;
    };
    const updated = await this.service.updateProject(id, safeBody);
    return this.ok<ProjectResponseDto>(c, updated);
  }

  /** IDOR: require auth; require ownership when project has ownerId. */
  public async deleteProject(c: Context): Promise<Response> {
    const id = this.parseProjectId(c);
    const project = await this.service.getProject(id);
    if (!project) {
      throw new NotFoundException("Project");
    }
    const userId = await getUserIdOptional(c);
    if (userId === null) {
      throw new ForbiddenException("Not authorized to access this project");
    }
    const ownerId =
      (project as ProjectResponseDto & { ownerId?: string }).ownerId;
    if (ownerId != null && userId !== ownerId) {
      throw new ForbiddenException("Not authorized to access this project");
    }
    await this.service.deleteProject(id);
    return c.json({ success: true }, 200);
  }

  private parseProjectId(c: Context): string {
    try {
      return projectIdSchema.parse(c.req.param("id"));
    } catch (error) {
      throw this.asValidationError("Invalid project id", error);
    }
  }

  private extractId(body: CreateProjectDto): string {
    const candidate = body.id;
    if (candidate === undefined || candidate === null) {
      return crypto.randomUUID();
    }
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    throw new ValidationException("Invalid id field", [
      { field: "id", message: "id must be a non-empty string" },
    ]);
  }

  private async parseBody<T>(
    c: Context,
    schema: { parse: (data: unknown) => T },
  ): Promise<T> {
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      throw this.asValidationError("Invalid JSON body", error);
    }

    try {
      return schema.parse(payload);
    } catch (error) {
      throw this.asValidationError("Validation failed", error);
    }
  }

  private ok<T>(c: Context, data: T): Response {
    const payload: SuccessResponse<T> = { success: true, data };
    return c.json(payload, 200);
  }

  private asValidationError(
    message: string,
    error: unknown,
  ): ValidationException {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return new ValidationException(message, details);
    }
    return new ValidationException(message);
  }
}
