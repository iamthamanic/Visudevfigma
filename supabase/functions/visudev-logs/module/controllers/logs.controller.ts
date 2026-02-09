import type { Context } from "hono";
import { ZodError } from "zod";
import type { CreateLogDto, LogResponseDto } from "../dto/index.ts";
import {
  NotFoundException,
  ValidationException,
} from "../internal/exceptions/index.ts";
import { LogsService } from "../services/logs.service.ts";
import {
  createLogBodySchema,
  logIdSchema,
  projectIdSchema,
} from "../validators/logs.validator.ts";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

export class LogsController {
  constructor(private readonly service: LogsService) {}

  public async listLogs(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const logs = await this.service.listLogs(projectId);
    const sorted = [...logs].sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
    return this.ok<LogResponseDto[]>(c, sorted);
  }

  public async getLog(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const logId = this.parseLogId(c);
    const log = await this.service.getLog(projectId, logId);
    if (!log) {
      throw new NotFoundException("Log");
    }
    return this.ok<LogResponseDto>(c, log);
  }

  public async createLog(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const body = await this.parseBody<CreateLogDto>(c, createLogBodySchema);
    const log = await this.service.createLog(projectId, body);
    return this.ok<LogResponseDto>(c, log);
  }

  public async deleteAllLogs(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const deleted = await this.service.deleteAllLogs(projectId);
    return c.json({ success: true, deleted }, 200);
  }

  public async deleteLog(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const logId = this.parseLogId(c);
    await this.service.deleteLog(projectId, logId);
    return c.json({ success: true }, 200);
  }

  private parseProjectId(c: Context): string {
    try {
      return projectIdSchema.parse(c.req.param("projectId"));
    } catch (error) {
      throw this.asValidationError("Invalid project id", error);
    }
  }

  private parseLogId(c: Context): string {
    try {
      return logIdSchema.parse(c.req.param("logId"));
    } catch (error) {
      throw this.asValidationError("Invalid log id", error);
    }
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
