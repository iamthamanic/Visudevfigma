import type { CodeFlow } from "../flow/code-flow.dto.ts";
import type { FrameworkDetectionResult } from "../framework/framework-detection.dto.ts";
import type { Screen } from "../screen/screen.dto.ts";

export interface AnalysisResultDto {
  analysisId: string;
  commitSha: string;
  screens: Screen[];
  flows: CodeFlow[];
  framework: FrameworkDetectionResult;
}
