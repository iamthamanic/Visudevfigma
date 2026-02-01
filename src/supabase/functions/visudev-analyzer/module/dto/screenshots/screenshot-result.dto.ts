export type ScreenshotStatus = "ok" | "error";

export interface ScreenshotResultDto {
  screenId: string;
  status: ScreenshotStatus;
  url?: string;
  error?: string;
}
