/**
 * Re-exports GitSummary normalization for frontend modules.
 * Applies demo enrichment when VITE_BLUEPRINT_DEMO_ENRICHMENT is enabled (same gate as normalize-blueprint).
 */

import { enrichGitSummaryIfThin } from "../../../shared/demo-git-thin.js";
import { normalizeGitSummary as normalizeGitSummaryCore } from "../../../shared/git-summary-normalize.js";
import type { GitSummary } from "../../../shared/visudev-api.types.js";

export function normalizeGitSummary(value: unknown): GitSummary {
  const summary = normalizeGitSummaryCore(value);
  if (import.meta.env.VITE_BLUEPRINT_DEMO_ENRICHMENT !== "true") {
    return summary;
  }
  return normalizeGitSummaryCore(enrichGitSummaryIfThin(summary));
}
