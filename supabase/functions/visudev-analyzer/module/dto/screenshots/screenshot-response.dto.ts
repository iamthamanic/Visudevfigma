import type { ScreenshotResultDto } from "./screenshot-result.dto.ts";

export interface ScreenshotResponseDto {
  captured: number;
  total: number;
  results: ScreenshotResultDto[];
}
