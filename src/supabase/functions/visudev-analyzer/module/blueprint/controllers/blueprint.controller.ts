import type { Context } from "hono";
import { ZodError } from "zod";
import type {
  BlueprintAnalysisRequestDto,
  BlueprintAnalysisResultDto,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import { ValidationException } from "../../internal/exceptions/index.ts";
import type { SuccessResponse } from "../../types/index.ts";
import { BlueprintAnalysisService } from "../services/blueprint-analysis.service.ts";
import { BlueprintProjectAccessService } from "../services/blueprint-project-access.service.ts";
import { BlueprintRateLimitService } from "../services/blueprint-rate-limit.service.ts";
import { blueprintRequestSchema } from "../../validators/blueprint.validator.ts";

export class BlueprintController {
  constructor(
    private readonly blueprintAnalysisService: BlueprintAnalysisService,
    private readonly blueprintRateLimitService: BlueprintRateLimitService,
    private readonly blueprintProjectAccessService:
      BlueprintProjectAccessService,
  ) {}

  public async analyze(c: Context): Promise<Response> {
    const body = await this.parseBody<BlueprintAnalysisRequestDto>(
      c,
      blueprintRequestSchema,
    );

    await this.blueprintProjectAccessService.assertCanAnalyze(c, body);

    const rateScope = body.projectId.trim();
    const allowed = await this.blueprintRateLimitService.allow(rateScope);
    if (!allowed) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }

    const result = await this.blueprintAnalysisService.analyze(body);
    return this.ok<BlueprintAnalysisResultDto>(c, result);
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
