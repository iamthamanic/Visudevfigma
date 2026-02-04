export type ScreenType = "page" | "screen" | "view" | "cli-command";
export type ScreenScreenshotStatus = "none" | "pending" | "ok" | "error";

export interface Screen {
  id: string;
  name: string;
  path: string;
  filePath: string;
  type: ScreenType;
  flows: string[];
  navigatesTo: string[];
  framework: string;
  componentCode?: string;
  lastAnalyzedCommit?: string;
  screenshotStatus?: ScreenScreenshotStatus;
  screenshotUrl?: string;
  lastScreenshotCommit?: string;
  tableName?: string;
  description?: string;
}

export interface FileContent {
  path: string;
  content: string;
}
