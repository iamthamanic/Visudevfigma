/* eslint-disable react-refresh/only-export-components */
// DEPRECATED - Use ../lib/visudev/store directly
// This file exists only for backwards compatibility

// Re-export everything from the new store
export { useVisudev as useProject, VisudevProvider as ProjectProvider } from "../lib/visudev/store";

// Re-export types
export type { Project, ScanStatus, ScanStatuses } from "../lib/visudev/types";
