import type { Context } from "hono";
import { ZodError } from "zod";
import type { CaptureRequestDto, HealthResponseDto } from "../dto/index.ts";
import { ValidationException } from "../internal/exceptions/index.ts";
import { ScreenshotsService } from "../services/screenshots.service.ts";
import type { SuccessResponse } from "../types/index.ts";
import { captureRequestSchema } from "../validators/screenshots.validator.ts";
import type { LoggerLike } from "../interfaces/module.interface.ts";

export class ScreenshotsController {
  constructor(
    private readonly service: ScreenshotsService,
    private readonly logger: LoggerLike,
    private readonly hasApiKey: () => boolean,
  ) {}

  public health(c: Context): Promise<Response> {
    const data: HealthResponseDto = {
      status: "ok",
      service: "visudev-screenshots",
      apiKeyConfigured: this.hasApiKey(),
      availableRoutes: ["/", "/health", "/capture"],
    };
    const payload: SuccessResponse<HealthResponseDto> = {
      success: true,
      data,
    };
    return Promise.resolve(c.json(payload, 200));
  }

  public async capture(c: Context): Promise<Response> {
    const body = await this.parseBody<CaptureRequestDto>(
      c,
      captureRequestSchema,
    );
    const data = await this.service.captureScreenshots(body);
    return c.json({ success: true, data, screenshots: data.screenshots }, 200);
  }

  private async parseBody<T>(
    c: Context,
    schema: { parse: (data: unknown) => T },
  ): Promise<T> {
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      this.logger.warn("Invalid JSON body", { error: this.toMessage(error) });
      throw this.asValidationError("Invalid JSON body", error);
    }

    try {
      return schema.parse(payload);
    } catch (error) {
      this.logger.warn("Validation failed", { error: this.toMessage(error) });
      throw this.asValidationError("Validation failed", error);
    }
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

  private toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
