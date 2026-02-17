import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WORKSPACE_ROOT = join(__dirname, "workspace");

export function sanitizeProjectId(projectId) {
  return (
    String(projectId)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 64) || "default"
  );
}

export function getWorkspaceDir(projectId) {
  return join(WORKSPACE_ROOT, sanitizeProjectId(projectId));
}
