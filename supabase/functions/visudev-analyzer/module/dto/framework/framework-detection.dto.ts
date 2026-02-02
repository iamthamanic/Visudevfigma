export interface FrameworkDetectionResult {
  detected: string[];
  primary: string | null;
  confidence: number;
}
