export type ScreenshotStatus = "ok" | "failed";

export interface ScreenInputDto {
  id: string;
  path: string;
}

export interface CaptureRequestDto {
  deployedUrl: string;
  repo?: string;
  commitSha?: string;
  routePrefix?: string;
  screens: ScreenInputDto[];
}

export interface ScreenshotResultDto {
  screenId: string;
  screenshotUrl: string | null;
  status: ScreenshotStatus;
  error?: string;
}

export interface CaptureResponseDto {
  screenshots: ScreenshotResultDto[];
}

export interface HealthResponseDto {
  status: "ok";
  service: "visudev-screenshots";
  apiKeyConfigured: boolean;
  availableRoutes: string[];
}
