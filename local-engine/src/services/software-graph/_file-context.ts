/**
 * Ensures domain/module/file scope hierarchy exists for a file path.
 */

import {
  detectDomain,
  detectLayer,
  detectModule,
  inferRuntime,
  normalizePath,
} from "./_heuristics.js";
import { createId, stableUniqueId } from "./_ids.js";
import { addEdge, addNode, addScope, type GraphBuilderState } from "./_state.js";
import { createDomainScope, createFileScope, createModuleScope } from "./_scopes.js";

export interface FileContext {
  domainId: string;
  moduleId: string;
  fileId: string;
}

export function ensureFileContext(
  filePath: string,
  projectId: string,
  state: GraphBuilderState,
): FileContext {
  const domain = detectDomain(filePath);
  const moduleName = detectModule(filePath, domain);
  const appId = `app:${projectId}`;
  const domainId = stableUniqueId(state.registry, "scope", `domain:${domain}`);
  const moduleId = stableUniqueId(state.registry, "scope", `module:${domain}:${moduleName}`);
  const fileId = stableUniqueId(state.registry, "scope", `file:${normalizePath(filePath)}`);

  if (!state.scopes.has(domainId)) {
    addScope(state, createDomainScope(domain, projectId));
    addNode(state, { id: domainId, kind: "domain", label: domain, scopeId: appId, metadata: {} });
    addEdge(state, {
      id: stableUniqueId(state.registry, "edge", createId("edge", appId, domainId)),
      kind: "contains",
      sourceId: appId,
      targetId: domainId,
      metadata: {},
    });
  }

  if (!state.scopes.has(moduleId)) {
    addScope(state, createModuleScope(moduleName, domain));
    addNode(state, {
      id: moduleId,
      kind: "module",
      label: moduleName,
      scopeId: domainId,
      metadata: { layer: detectLayer(filePath) },
    });
    addEdge(state, {
      id: stableUniqueId(state.registry, "edge", createId("edge", domainId, moduleId)),
      kind: "contains",
      sourceId: domainId,
      targetId: moduleId,
      metadata: {},
    });
  }

  if (!state.scopes.has(fileId)) {
    addScope(state, createFileScope(filePath, moduleId));
    addNode(state, {
      id: fileId,
      kind: "file",
      label: filePath.split("/").pop() || filePath,
      scopeId: moduleId,
      filePath,
      metadata: { runtime: inferRuntime(filePath) },
    });
    addEdge(state, {
      id: stableUniqueId(state.registry, "edge", createId("edge", moduleId, fileId)),
      kind: "contains",
      sourceId: moduleId,
      targetId: fileId,
      metadata: {},
    });
  }

  return { domainId, moduleId, fileId };
}
