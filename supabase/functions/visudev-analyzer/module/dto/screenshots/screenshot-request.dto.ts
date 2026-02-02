export interface ScreenshotScreenInput {
  id: string;
  name: string;
  path: string;
}

export interface ScreenshotRequestDto {
  projectId: string;
  baseUrl: string;
  screens: ScreenshotScreenInput[];
}
