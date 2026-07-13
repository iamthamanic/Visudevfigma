/**
 * Scope factory helpers for the Software Graph builder.
 */

import type { SoftwareGraphScope } from "../../types/api.types.js";
import { normalizePath } from "./_heuristics.js";

export function createOrganizationScope(projectId: string): SoftwareGraphScope {
  return { level: "organization", id: `org:${projectId}`, label: projectId };
}

export function createApplicationScope(projectId: string): SoftwareGraphScope {
  return {
    level: "application",
    id: `app:${projectId}`,
    label: projectId,
    parentId: `org:${projectId}`,
  };
}

export function createDomainScope(domain: string, projectId: string): SoftwareGraphScope {
  return { level: "domain", id: `domain:${domain}`, label: domain, parentId: `app:${projectId}` };
}

export function createModuleScope(moduleName: string, domain: string): SoftwareGraphScope {
  return {
    level: "module",
    id: `module:${domain}:${moduleName}`,
    label: moduleName,
    parentId: `domain:${domain}`,
  };
}

export function createFileScope(filePath: string, moduleId: string): SoftwareGraphScope {
  return {
    level: "file",
    id: `file:${normalizePath(filePath)}`,
    label: filePath.split("/").pop() || filePath,
    parentId: moduleId,
  };
}
