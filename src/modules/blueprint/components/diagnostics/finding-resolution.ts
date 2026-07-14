/**
 * Shared open/resolved labels for Diagnostics finding triage in the UI.
 * Kept separate from table/inspector components so resolution state can evolve
 * without coupling to presentation widgets.
 */

export type FindingResolutionStatus = "open" | "resolved";
