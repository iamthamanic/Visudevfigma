import { BaseService } from "./base.service.ts";
import {
  ConfigException,
  ExternalApiException,
} from "../internal/exceptions/index.ts";

export class ScreenshotApiService extends BaseService {
  public async capture(targetUrl: string): Promise<Uint8Array> {
    if (!this.config.apiKey) {
      throw new ConfigException("SCREENSHOT_API_KEY not configured");
    }

    const apiUrl = new URL(this.config.apiBaseUrl);
    apiUrl.searchParams.set("access_key", this.config.apiKey);
    apiUrl.searchParams.set("url", targetUrl);
    apiUrl.searchParams.set("format", this.config.format);
    apiUrl.searchParams.set(
      "viewport_width",
      String(this.config.viewportWidth),
    );
    apiUrl.searchParams.set(
      "viewport_height",
      String(this.config.viewportHeight),
    );
    apiUrl.searchParams.set(
      "device_scale_factor",
      String(this.config.deviceScaleFactor),
    );
    apiUrl.searchParams.set(
      "full_page",
      this.booleanParam(this.config.fullPage),
    );
    apiUrl.searchParams.set("delay", String(this.config.delaySeconds));

    this.logger.info("Fetching screenshot", {
      url: targetUrl,
      api: this.maskApiKey(apiUrl.toString()),
    });

    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      const body = await response.text();
      const snippet = body.substring(0, 500);
      const message = `HTTP ${response.status}: ${response.statusText}`;
      this.logger.warn("Screenshot API error", { message, body: snippet });
      throw new ExternalApiException(
        `${message} - ${snippet}`,
        response.status,
      );
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  private booleanParam(value: boolean): string {
    return value ? "true" : "false";
  }

  private maskApiKey(url: string): string {
    if (!this.config.apiKey) {
      return url;
    }
    return url.replace(this.config.apiKey, "XXX");
  }
}
