// VisuDEV Core Types
export type ScanStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface Screen {
  id: string;
  name: string;
  path: string;
  screenshotUrl?: string;
  depth?: number;
}

export interface Flow {
  id: string;
  name: string;
  type: string;
  source: string;
  target: string;
  trigger?: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  github_repo?: string;
  github_branch?: string;
  deployed_url?: string;
  screens: Screen[];
  flows: Flow[];
  createdAt: string;
}

export interface AnalysisResult {
  screens: Screen[];
  flows: Flow[];
  stats: {
    totalScreens: number;
    totalFlows: number;
    maxDepth: number;
  };
}

export interface ScanResult {
  id: string;
  projectId: string;
  scanType: 'appflow' | 'blueprint' | 'data';
  status: ScanStatus;
  progress: number;
  result?: AnalysisResult;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ScanStatuses {
  appflow: { status: ScanStatus; progress: number; message?: string; error?: string };
  blueprint: { status: ScanStatus; progress: number; message?: string; error?: string };
  data: { status: ScanStatus; progress: number; message?: string; error?: string };
}
