import { BaseService } from "./base.service.ts";
import type {
  CaptureRequestDto,
  CaptureResponseDto,
  ScreenshotResultDto,
} from "../dto/index.ts";
import { StorageRepository } from "../internal/repositories/storage.repository.ts";
import { ScreenshotApiService } from "./screenshot-api.service.ts";
import {
  ConfigException,
  ServiceException,
} from "../internal/exceptions/index.ts";

export class ScreenshotsService extends BaseService {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly apiService: ScreenshotApiService,
  ) {
    super();
  }

  public async captureScreenshots(
    request: CaptureRequestDto,
  ): Promise<CaptureResponseDto> {
    if (!this.config.apiKey) {
      throw new ConfigException("SCREENSHOT_API_KEY not configured");
    }

    await this.storageRepository.ensureBucket(
      this.config.bucketName,
      this.config.bucketPublic,
    );

    const results: ScreenshotResultDto[] = [];
    const normalizedPrefix = this.normalizePrefix(request.routePrefix);

    this.logger.info("Starting screenshot capture", {
      deployedUrl: request.deployedUrl,
      count: request.screens.length,
    });

    for (const screen of request.screens) {
      try {
        const screenPath = this.normalizePath(screen.path);
        const pathWithPrefix = normalizedPrefix &&
            !screenPath.startsWith(normalizedPrefix)
          ? `${normalizedPrefix}${screenPath}`
          : screenPath;
        const targetUrl = new URL(pathWithPrefix, request.deployedUrl)
          .toString();

        this.logger.info("Processing screen", {
          screenId: screen.id,
          path: screen.path,
          targetUrl,
        });

        const image = await this.apiService.capture(targetUrl);
        const storagePath = this.buildStoragePath(
          request.deployedUrl,
          request.commitSha,
          screen.id,
        );
        const contentType = this.getContentType();

        const publicUrl = await this.storageRepository.uploadPublic(
          this.config.bucketName,
          storagePath,
          image,
          contentType,
        );

        results.push({
          screenId: screen.id,
          screenshotUrl: publicUrl,
          status: "ok",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn("Screenshot capture failed", {
          screenId: screen.id,
          error: message,
        });
        results.push({
          screenId: screen.id,
          screenshotUrl: null,
          status: "failed",
          error: message,
        });
      }
    }

    const successCount =
      results.filter((result) => result.status === "ok").length;
    this.logger.info("Screenshot capture complete", {
      successCount,
      total: results.length,
    });

    return { screenshots: results };
  }

  private normalizePrefix(prefix?: string): string | null {
    if (!prefix) {
      return null;
    }
    const normalized = prefix.startsWith("/") ? prefix : `/${prefix}`;
    return normalized.endsWith("/") && normalized !== "/"
      ? normalized.slice(0, -1)
      : normalized;
  }

  private normalizePath(path: string): string {
    if (!path) {
      throw new ServiceException(
        "Screen path is required",
        400,
        "INVALID_PATH",
      );
    }
    return path.startsWith("/") ? path : `/${path}`;
  }

  private buildStoragePath(
    deployedUrl: string,
    commitSha: string | undefined,
    screenId: string,
  ): string {
    const projectKey = encodeURIComponent(
      deployedUrl.replace(/^https?:\/\//, "").replace(/\//g, "-"),
    );

    if (commitSha) {
      return `screens/${projectKey}/${commitSha}/${screenId}.${this.config.format}`;
    }

    return `screens/${projectKey}/latest/${screenId}.${this.config.format}`;
  }

  private getContentType(): string {
    const format = this.config.format.toLowerCase();
    if (format === "png") {
      return "image/png";
    }
    return "image/jpeg";
  }
}
