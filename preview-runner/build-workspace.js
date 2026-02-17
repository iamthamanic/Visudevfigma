import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WORKSPACE_ROOT = join(__dirname, "workspace");
const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function sanitizeProjectId(projectId) {
  const normalized = String(projectId || "").trim();
  if (!PROJECT_ID_PATTERN.test(normalized)) {
    throw new Error("Invalid projectId. Expected [A-Za-z0-9_-]{1,64}.");
  }
  return normalized;
}

export function getWorkspaceDir(projectId) {
  return join(WORKSPACE_ROOT, sanitizeProjectId(projectId));
}
