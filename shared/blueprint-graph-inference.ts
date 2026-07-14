/**
 * Heuristic security inference for graph-derived legacy diagnostics.
 */

import type {
  ProjectedCodeFact,
  ProjectedRoute,
  ProjectedSecurityMatrixRow,
} from "./blueprint-graph-types.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const AUTH_EVIDENCE_PATTERN = /auth|middleware|protect|guard|session|jwt|oauth/i;
const VALIDATION_EVIDENCE_PATTERN =
  /zod|joi|yup|validator|validate|schema|body\(|query\(|params\(/i;

type NormalizedRoute = Pick<ProjectedRoute, "id" | "method" | "path" | "filePath" | "line">;

export interface RouteFactsIndexes {
  routeFactsIndex: Map<string, ProjectedCodeFact[]>;
  factsByFilePath: Map<string, ProjectedCodeFact[]>;
  authByDirectory: Map<string, boolean>;
  validationByFile: Map<string, boolean>;
}

function dirnameOfFile(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash <= 0 ? "" : filePath.slice(0, lastSlash);
}

function isPathUnderDirectory(filePath: string, directory: string): boolean {
  if (!directory) return false;
  if (filePath === directory) return true;
  return filePath.startsWith(`${directory}/`);
}

function indexFactsByFilePath(facts: ProjectedCodeFact[]): Map<string, ProjectedCodeFact[]> {
  const factsByFilePath = new Map<string, ProjectedCodeFact[]>();
  for (const fact of facts) {
    const list = factsByFilePath.get(fact.filePath) ?? [];
    list.push(fact);
    factsByFilePath.set(fact.filePath, list);
  }
  return factsByFilePath;
}

function buildFactsByAncestorDirectory(
  facts: ProjectedCodeFact[],
): Map<string, ProjectedCodeFact[]> {
  const index = new Map<string, ProjectedCodeFact[]>();
  for (const fact of facts) {
    let directory = dirnameOfFile(fact.filePath);
    while (directory) {
      const list = index.get(directory) ?? [];
      list.push(fact);
      index.set(directory, list);
      const parent = dirnameOfFile(directory);
      if (!parent || parent === directory) break;
      directory = parent;
    }
  }
  return index;
}

function buildScopedDirectoryFacts(
  factsByDirectory: Map<string, ProjectedCodeFact[]>,
): Map<string, ProjectedCodeFact[]> {
  const scoped = new Map<string, ProjectedCodeFact[]>();
  for (const [directory, candidates] of factsByDirectory) {
    const seen = new Set<string>();
    const scopedFacts: ProjectedCodeFact[] = [];
    for (const fact of candidates) {
      if (seen.has(fact.id)) continue;
      if (!isPathUnderDirectory(fact.filePath, directory)) continue;
      seen.add(fact.id);
      scopedFacts.push(fact);
    }
    scoped.set(directory, scopedFacts);
  }
  return scoped;
}

function buildAuthByDirectory(
  scopedDirectoryFacts: Map<string, ProjectedCodeFact[]>,
): Map<string, boolean> {
  const authByDirectory = new Map<string, boolean>();
  for (const [directory, dirFacts] of scopedDirectoryFacts) {
    authByDirectory.set(
      directory,
      dirFacts.some((fact) => AUTH_EVIDENCE_PATTERN.test(fact.snippet)),
    );
  }
  return authByDirectory;
}

function buildValidationByFile(
  factsByFilePath: Map<string, ProjectedCodeFact[]>,
): Map<string, boolean> {
  const validationByFile = new Map<string, boolean>();
  for (const [filePath, fileFacts] of factsByFilePath) {
    validationByFile.set(
      filePath,
      fileFacts.some((fact) => VALIDATION_EVIDENCE_PATTERN.test(fact.snippet)),
    );
  }
  return validationByFile;
}

export function buildRouteFactsIndexes(
  routes: ProjectedRoute[],
  facts: ProjectedCodeFact[],
): RouteFactsIndexes {
  const factsByFilePath = indexFactsByFilePath(facts);
  const factsByDirectory = buildFactsByAncestorDirectory(facts);
  const scopedDirectoryFacts = buildScopedDirectoryFacts(factsByDirectory);
  const authByDirectory = buildAuthByDirectory(scopedDirectoryFacts);
  const validationByFile = buildValidationByFile(factsByFilePath);
  const routeFactsIndex = new Map<string, ProjectedCodeFact[]>();

  for (const route of routes) {
    const directory = dirnameOfFile(route.filePath);
    routeFactsIndex.set(route.id, scopedDirectoryFacts.get(directory) ?? []);
  }

  return {
    routeFactsIndex,
    factsByFilePath,
    authByDirectory,
    validationByFile,
  };
}

export function buildRouteFactsIndex(
  routes: ProjectedRoute[],
  facts: ProjectedCodeFact[],
): Map<string, ProjectedCodeFact[]> {
  return buildRouteFactsIndexes(routes, facts).routeFactsIndex;
}

function resolveAuthState(
  route: NormalizedRoute,
  hasAuthEvidence: boolean,
): ProjectedSecurityMatrixRow["auth"]["state"] {
  if (hasAuthEvidence) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

function resolveValidationState(
  route: NormalizedRoute,
  hasValidationEvidence: boolean,
): ProjectedSecurityMatrixRow["validation"]["state"] {
  if (hasValidationEvidence) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

export function inferAuthState(
  route: NormalizedRoute,
  routeFacts: ProjectedCodeFact[],
): ProjectedSecurityMatrixRow["auth"]["state"] {
  return resolveAuthState(
    route,
    routeFacts.some((fact) => AUTH_EVIDENCE_PATTERN.test(fact.snippet)),
  );
}

export function inferValidationState(
  route: NormalizedRoute,
  routeFacts: ProjectedCodeFact[],
): ProjectedSecurityMatrixRow["validation"]["state"] {
  return resolveValidationState(
    route,
    routeFacts.some(
      (fact) => fact.filePath === route.filePath && VALIDATION_EVIDENCE_PATTERN.test(fact.snippet),
    ),
  );
}

export interface RouteInference {
  auth: ProjectedSecurityMatrixRow["auth"]["state"];
  validation: ProjectedSecurityMatrixRow["validation"]["state"];
}

export function inferRouteStates(
  routes: ProjectedRoute[],
  indexes: RouteFactsIndexes,
): Map<string, RouteInference> {
  const states = new Map<string, RouteInference>();
  for (const route of routes) {
    const directory = dirnameOfFile(route.filePath);
    states.set(route.id, {
      auth: resolveAuthState(route, indexes.authByDirectory.get(directory) ?? false),
      validation: resolveValidationState(
        route,
        indexes.validationByFile.get(route.filePath) ?? false,
      ),
    });
  }
  return states;
}
