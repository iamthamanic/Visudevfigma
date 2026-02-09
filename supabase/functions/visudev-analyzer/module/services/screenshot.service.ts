import { BaseService } from "./base.service.ts";
import type {
  ScreenshotRequestDto,
  ScreenshotResponseDto,
  ScreenshotResultDto,
} from "../dto/index.ts";
import {
  ConfigException,
  ExternalApiException,
  ServiceException,
} from "../internal/exceptions/index.ts";

export class ScreenshotService extends BaseService {
  public async captureScreenshots(
    request: ScreenshotRequestDto,
  ): Promise<ScreenshotResponseDto> {
    if (!this.config.screenshot.apiKey) {
      throw new ConfigException("SCREENSHOT_API_KEY not configured");
    }

    this.logger.info("Capturing screenshots", {
      projectId: request.projectId,
      count: request.screens.length,
    });

    const results: ScreenshotResultDto[] = [];

    for (const screen of request.screens) {
      try {
        const fullUrl = `${request.baseUrl}${screen.path}`;
        this.logger.info("Capturing screen", {
          name: screen.name,
          url: fullUrl,
        });

        const buffer = await this.captureScreenshot(
          fullUrl,
          this.config.screenshot.apiKey,
        );
        const screenPath = this.getScreenPath(fullUrl);
        const signedUrl = await this.uploadScreenshotToStorage(
          buffer,
          request.projectId,
          screenPath,
        );

        results.push({
          screenId: screen.id,
          status: "ok",
          url: signedUrl,
        });

        this.logger.info("Screenshot captured", { name: screen.name });
        await this.sleep(this.config.screenshot.delayMs);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        this.logger.warn("Screenshot capture failed", {
          screenId: screen.id,
          error: message,
        });
        results.push({
          screenId: screen.id,
          status: "error",
          error: message,
        });
      }
    }

    const successCount =
      results.filter((result) => result.status === "ok").length;
    return {
      captured: successCount,
      total: request.screens.length,
      results,
    };
  }

  private async captureScreenshot(
    url: string,
    apiKey: string,
  ): Promise<ArrayBuffer> {
    const screenshotApiUrl = new URL(this.config.screenshot.apiBaseUrl);
    screenshotApiUrl.searchParams.set("access_key", apiKey);
    screenshotApiUrl.searchParams.set("url", url);
    screenshotApiUrl.searchParams.set(
      "viewport_width",
      String(this.config.screenshot.viewportWidth),
    );
    screenshotApiUrl.searchParams.set(
      "viewport_height",
      String(this.config.screenshot.viewportHeight),
    );
    screenshotApiUrl.searchParams.set(
      "device_scale_factor",
      String(this.config.screenshot.deviceScaleFactor),
    );
    screenshotApiUrl.searchParams.set("format", this.config.screenshot.format);
    screenshotApiUrl.searchParams.set(
      "image_quality",
      String(this.config.screenshot.imageQuality),
    );
    screenshotApiUrl.searchParams.set(
      "block_ads",
      this.booleanParam(this.config.screenshot.blockAds),
    );
    screenshotApiUrl.searchParams.set(
      "block_cookie_banners",
      this.booleanParam(this.config.screenshot.blockCookieBanners),
    );
    screenshotApiUrl.searchParams.set(
      "block_trackers",
      this.booleanParam(this.config.screenshot.blockTrackers),
    );
    screenshotApiUrl.searchParams.set("cache", "true");
    screenshotApiUrl.searchParams.set(
      "cache_ttl",
      String(this.config.screenshot.cacheTtlSeconds),
    );

    const response = await fetch(screenshotApiUrl.toString());
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error("Screenshot API error", {
        status: response.status,
        error: errorText,
      });
      throw new ExternalApiException(
        `Screenshot API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return await response.arrayBuffer();
  }

  private async uploadScreenshotToStorage(
    screenshotBuffer: ArrayBuffer,
    projectId: string,
    screenPath: string,
  ): Promise<string> {
    const bucketName = this.config.screenshot.bucketName;
    await this.ensureBucket(bucketName);

    const cleanPath = screenPath.replace(/^\//, "").replace(/\//g, "_") ||
      "home";
    const fileName =
      `${projectId}/${cleanPath}_${Date.now()}.${this.config.screenshot.format}`;

    const { error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, screenshotBuffer, {
        contentType: this.getContentType(),
        upsert: true,
      });

    if (error) {
      this.logger.error("Screenshot upload failed", { error: error.message });
      throw new ServiceException(
        `Storage upload error: ${error.message}`,
        500,
        "STORAGE_ERROR",
      );
    }

    const { data, error: signedError } = await this.supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, this.config.screenshot.signedUrlTtlSeconds);

    if (signedError) {
      this.logger.error("Signed URL creation failed", {
        error: signedError.message,
      });
      throw new ServiceException(
        `Signed URL error: ${signedError.message}`,
        500,
        "STORAGE_ERROR",
      );
    }

    if (!data?.signedUrl) {
      throw new ServiceException(
        "Failed to create signed URL",
        500,
        "STORAGE_ERROR",
      );
    }

    return data.signedUrl;
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    const { data, error } = await this.supabase.storage.listBuckets();
    if (error) {
      this.logger.error("Bucket listing failed", { error: error.message });
      throw new ServiceException(
        `Bucket listing error: ${error.message}`,
        500,
        "STORAGE_ERROR",
      );
    }

    const exists = data?.some((bucket) => bucket.name === bucketName);
    if (exists) {
      return;
    }

    this.logger.info("Creating storage bucket", { bucketName });
    const { error: createError } = await this.supabase.storage.createBucket(
      bucketName,
      {
        public: false,
      },
    );

    if (createError) {
      this.logger.error("Bucket creation failed", {
        error: createError.message,
      });
      throw new ServiceException(
        `Bucket creation error: ${createError.message}`,
        500,
        "STORAGE_ERROR",
      );
    }
  }

  private getScreenPath(url: string): string {
    try {
      return new URL(url).pathname;
    } catch (_error) {
      throw new ServiceException("Invalid screen URL", 400, "INVALID_URL");
    }
  }

  private getContentType(): string {
    const format = this.config.screenshot.format.toLowerCase();
    if (format === "png") {
      return "image/png";
    }
    return "image/jpeg";
  }

  private booleanParam(value: boolean): string {
    return value ? "true" : "false";
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
