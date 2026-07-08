/** Local App Flow analysis from file entries (shared by CLI and future GitHub path). */

import type {
  AnalysisGraph,
  AnalysisQuality,
  CodeFlow,
  FileContent,
  FrameworkDetectionResult,
  Screen,
} from "../dto/index.ts";
import type { AnalyzerModuleConfig } from "../interfaces/module.interface.ts";
import { initModuleServices } from "./base.service.ts";
import { FlowService } from "./flow.service.ts";
import { GraphService } from "./graph.service.ts";
import { NavigationLinkExtractor } from "./navigation-link-extractor.ts";
import { PageLikeExtractor } from "./page-like-extractor.ts";
import { ScreenExtractionService } from "./screen-extraction.service.ts";
import { ScreenService } from "./screen.service.ts";
import { StateTargetExtractor } from "./state-target-extractor.ts";

export interface AppflowFileSourceEntry {
  path: string;
  content: string;
}

export interface AnalyzeAppflowFromFilesInput {
  projectId?: string;
  localPath?: string;
  fileEntries: AppflowFileSourceEntry[];
  fileLimit?: number;
  commitSha?: string;
}

export interface AppflowAnalysisPayload {
  analysisId: string;
  commitSha: string;
  screens: Screen[];
  flows: CodeFlow[];
  framework: FrameworkDetectionResult;
  graph: AnalysisGraph;
  quality: AnalysisQuality;
  filesAnalyzed: number;
}

let cliServicesReady = false;

function ensureCliServices(): {
  flowService: FlowService;
  screenService: ScreenService;
  graphService: GraphService;
} {
  if (!cliServicesReady) {
    initModuleServices(createCliModuleConfig());
    cliServicesReady = true;
  }
  const nav = new NavigationLinkExtractor();
  const screenExtractor = new ScreenExtractionService(
    nav,
    new StateTargetExtractor(),
    new PageLikeExtractor(nav),
  );
  return {
    flowService: new FlowService(),
    screenService: new ScreenService(screenExtractor),
    graphService: new GraphService(),
  };
}

export function analyzeAppflowFromFileEntries(
  input: AnalyzeAppflowFromFilesInput,
): AppflowAnalysisPayload {
  const { flowService, screenService, graphService } = ensureCliServices();
  const fileLimit = Math.max(input.fileLimit ?? 250, 1);
  const entries = input.fileEntries.slice(0, fileLimit);
  const fileContents: FileContent[] = [];
  const allFlows: CodeFlow[] = [];

  for (const entry of entries) {
    const flows = flowService.analyzeFile(entry.path, entry.content);
    allFlows.push(...flows);
    fileContents.push({ path: entry.path, content: entry.content });
  }

  const commitSha = input.commitSha?.trim() ||
    hashLocalPath(input.localPath ?? "local");
  const { screens, framework } = screenService.extractScreens(fileContents);
  const mappedScreens = flowService.mapFlowsToScreens(
    screens,
    allFlows,
    commitSha,
  );
  const { graph, quality } = graphService.buildGraph(
    mappedScreens,
    allFlows,
    framework,
    commitSha,
  );

  return {
    analysisId: crypto.randomUUID(),
    commitSha,
    screens: mappedScreens,
    flows: allFlows,
    framework,
    graph,
    quality,
    filesAnalyzed: entries.length,
  };
}

function hashLocalPath(localPath: string): string {
  let hash = 0;
  for (let index = 0; index < localPath.length; index += 1) {
    hash = (hash * 31 + localPath.charCodeAt(index)) >>> 0;
  }
  return `local-${hash.toString(16).padStart(8, "0")}`;
}

function createCliModuleConfig(): AnalyzerModuleConfig {
  const noop = () => {};
  return {
    supabase: {} as AnalyzerModuleConfig["supabase"],
    logger: {
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
    },
    config: {
      kvTableName: "visudev_kv",
      githubApiBaseUrl: "https://api.github.com",
      analysisFileLimit: 250,
      analysisProgressLogEvery: 0,
      fallbackRoutes: [],
      screenshot: {
        apiBaseUrl: "https://api.screenshotone.com",
        bucketName: "screenshots",
        viewportWidth: 1280,
        viewportHeight: 800,
        deviceScaleFactor: 1,
        imageQuality: 80,
        format: "png",
        blockAds: true,
        blockCookieBanners: true,
        blockTrackers: true,
        cacheTtlSeconds: 3600,
        delayMs: 500,
        signedUrlTtlSeconds: 3600,
      },
      anthropic: {
        apiBaseUrl: "https://api.anthropic.com",
        model: "claude-sonnet-4-20250514",
        maxTokens: 1024,
        version: "2023-06-01",
      },
    },
    resolveUserIdFromJwt: () => Promise.resolve(null),
  } as unknown as AnalyzerModuleConfig;
}
