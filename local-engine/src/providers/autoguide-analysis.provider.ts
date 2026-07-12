/**
 * Production AutoGuide blueprint analysis via @autoguide/scanner.
 * Returns a RawBlueprintScan; the shared enrichment pipeline turns it into
 * the canonical BlueprintDocument.
 * Location: local-engine/src/providers/autoguide-analysis.provider.ts
 */

import path from "node:path";
import { existsSync } from "node:fs";
import type { BlueprintAnalysisProviderId, RawBlueprintScan } from "../types/api.types.js";
import type { BlueprintProvider, BlueprintProviderInput } from "./blueprint-provider.interface.js";
import { loadAutoGuideScanner } from "../lib/autoguide-loader.js";
import { mapAutoGuideToRaw } from "../lib/autoguide-to-raw.mapper.js";

export type AutoGuideProviderOptions = {
  autoguideRoot?: string;
  sourceSubdir?: string;
};

export class AutoGuideAnalysisProvider implements BlueprintProvider {
  readonly id: BlueprintAnalysisProviderId = "autoguide";
  readonly name = "AutoGuide";

  constructor(private readonly options: AutoGuideProviderOptions = {}) {}

  async scanProject(input: BlueprintProviderInput): Promise<RawBlueprintScan> {
    const localPath = input.localPath ?? input.project.localPath;
    if (!localPath) {
      throw Object.assign(new Error("AutoGuide analysis requires a local project path."), {
        code: "MISSING_LOCAL_PATH",
      });
    }

    const sourceSubdir = this.options.sourceSubdir?.trim() || "src";
    const sourceDir = path.join(localPath, sourceSubdir);
    if (!existsSync(sourceDir)) {
      throw Object.assign(new Error(`AutoGuide source directory not found: ${sourceDir}`), {
        code: "AUTOGUIDE_SOURCE_DIR_MISSING",
      });
    }

    let scanner;
    try {
      scanner = await loadAutoGuideScanner(this.options.autoguideRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AutoGuide packages unavailable.";
      throw Object.assign(new Error(message), { code: "AUTOGUIDE_PACKAGES_UNAVAILABLE" });
    }

    try {
      const source = await scanner.scanSourceProject(sourceDir);
      const merged = scanner.mergeScanResults(source);
      return mapAutoGuideToRaw({
        projectId: input.projectId,
        localPath,
        sourceDir,
        source,
        merged,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AutoGuide scan failed.";
      throw Object.assign(new Error(message), { code: "AUTOGUIDE_SCAN_FAILED" });
    }
  }
}
