import type { Context } from "hono";
import { ZodError } from "zod";
import type {
  AnalysisRecord,
  AnalysisRequestDto,
  AnalysisResultDto,
  ScreenshotRequestDto,
  ScreenshotResponseDto,
} from "../dto/index.ts";
import { ValidationException } from "../internal/exceptions/index.ts";
import { AnalysisService } from "../services/analysis.service.ts";
import { ScreenshotService } from "../services/screenshot.service.ts";
import type { SuccessResponse } from "../types/index.ts";
import {
  analysisIdSchema,
  analysisRequestSchema,
  screenshotRequestSchema,
} from "../validators/analyzer.validator.ts";

export class AnalyzerController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly screenshotService: ScreenshotService,
  ) {}

  public health(c: Context): Promise<Response> {
    return this.ok(c, {
      service: "visudev-analyzer",
      version: "4.0.0",
      endpoints: ["/analyze", "/screenshots", "/analysis/:id"],
    });
  }

  public async analyze(c: Context): Promise<Response> {
    const body = await this.parseBody<AnalysisRequestDto>(c, analysisRequestSchema);
    const result = await this.analysisService.analyze(body);
    return this.ok<AnalysisResultDto>(c, result);
  }

  public async getAnalysis(c: Context): Promise<Response> {
    const id = this.parseId(c);
    const analysis = await this.analysisService.getAnalysis(id);
    return this.ok<AnalysisRecord>(c, analysis);
  }

  public async captureScreenshots(c: Context): Promise<Response> {
    const body = await this.parseBody<ScreenshotRequestDto>(c, screenshotRequestSchema);
    const result = await this.screenshotService.captureScreenshots(body);
    return this.ok<ScreenshotResponseDto>(c, result);
  }

  private parseId(c: Context): string {
    try {
      return analysisIdSchema.parse(c.req.param("id"));
    } catch (error) {
      throw this.asValidationError("Invalid analysis id", error);
    }
  }

  private async parseBody<T>(c: Context, schema: { parse: (data: unknown) => T }): Promise<T> {
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

  private asValidationError(message: string, error: unknown): ValidationException {
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
