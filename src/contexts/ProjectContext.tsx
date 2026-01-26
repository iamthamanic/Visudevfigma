// DEPRECATED - Use ../lib/visudev/store directly
// This file exists only for backwards compatibility

// Re-export everything from the new store
export { useVisudev as useProject, VisudevProvider as ProjectProvider } from '../lib/visudev/store';

// Re-export types
export type { Project, ScanStatuses } from '../lib/visudev/types';

export type ScanStatus = 'idle' | 'running' | 'completed' | 'failed';
