/** AST import/call graph extraction for Blueprint (acorn + acorn-typescript). */

import * as acorn from "acorn";
// acorn-typescript default export is callable at runtime; npm types are incomplete.
import acornTypescript from "acorn-typescript";
import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { resolveImport } from "./import-resolver.ts";
import type { FileIndexEntry } from "./call-graph.builder.ts";

const Parser = acorn.Parser.extend(
  (acornTypescript as unknown as () => Parameters<
    typeof acorn.Parser.extend
  >[0])(),
);

type AstNode = {
  type: string;
  [key: string]: unknown;
};

export interface AstCallTarget {
  callee: string;
  line: number;
  targetFile: string | null;
}

export interface AstImportBinding {
  localName: string;
  specifier: string;
  resolvedPath: string | null;
  line: number;
}

export interface AstModuleGraph {
  imports: AstImportBinding[];
  calls: AstCallTarget[];
  source: "ast";
}

function makeFactId(filePath: string, line: number, kind: string): string {
  const safePath = filePath.replace(/[^a-zA-Z0-9]+/g, "-").replace(
    /^-|-$/g,
    "",
  );
  return `fact-${safePath}-${line}-${kind}`;
}

function trimSnippet(line: string, max = 120): string {
  const trimmed = line.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function isAstParsableFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return Boolean(ext && ["ts", "tsx", "js", "jsx", "mts", "cts"].includes(ext));
}

export function parseAstModuleGraph(
  content: string,
  filePath: string,
  knownPaths?: ReadonlySet<string>,
): AstModuleGraph | null {
  if (!isAstParsableFile(filePath)) return null;

  let ast: AstNode;
  try {
    ast = Parser.parse(content, {
      ecmaVersion: "latest",
      sourceType: "module",
    }) as unknown as AstNode;
  } catch {
    return null;
  }

  const imports: AstImportBinding[] = [];
  const importByLocal = new Map<string, AstImportBinding>();
  const calls: AstCallTarget[] = [];

  walkAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      const source = node.source as AstNode | undefined;
      const specifier = typeof source?.value === "string" ? source.value : "";
      const line = readLine(node);
      for (const spec of asArray(node.specifiers)) {
        const localName = readLocalName(spec);
        if (!localName) continue;
        const binding: AstImportBinding = {
          localName,
          specifier,
          resolvedPath: resolveImport(specifier, filePath, knownPaths),
          line,
        };
        imports.push(binding);
        importByLocal.set(localName, binding);
      }
      return;
    }

    if (node.type === "CallExpression") {
      const callee = readCalleeName(node.callee as AstNode | undefined);
      if (!callee) return;
      const line = readLine(node);
      const binding = importByLocal.get(callee);
      calls.push({
        callee,
        line,
        targetFile: binding?.resolvedPath ?? null,
      });
    }
  });

  return { imports, calls, source: "ast" };
}

export function buildAstFactsFromGraph(
  filePath: string,
  content: string,
  graph: AstModuleGraph,
): CodeFact[] {
  const lines = content.split("\n");
  const facts: CodeFact[] = [];

  for (const binding of graph.imports) {
    facts.push({
      id: makeFactId(filePath, binding.line, `ast-import-${binding.localName}`),
      kind: "ast-import",
      filePath,
      line: binding.line,
      snippet: trimSnippet(lines[binding.line - 1] ?? binding.specifier),
      metadata: {
        localName: binding.localName,
        specifier: binding.specifier,
        resolvedPath: binding.resolvedPath,
        extractor: graph.source,
      },
    });
  }

  for (const call of graph.calls) {
    facts.push({
      id: makeFactId(filePath, call.line, `ast-call-${call.callee}`),
      kind: "ast-call",
      filePath,
      line: call.line,
      snippet: trimSnippet(lines[call.line - 1] ?? call.callee),
      metadata: {
        callee: call.callee,
        targetFile: call.targetFile,
        extractor: graph.source,
      },
    });
  }

  return facts;
}

export function extractAstFactsFromFile(
  filePath: string,
  content: string,
  fileIndex?: ReadonlyMap<string, FileIndexEntry>,
): CodeFact[] {
  const knownPaths = fileIndex ? new Set(fileIndex.keys()) : undefined;
  const graph = parseAstModuleGraph(content, filePath, knownPaths);
  if (!graph) return [];
  return buildAstFactsFromGraph(filePath, content, graph);
}

export function collectAstCallTargets(
  content: string,
  filePath: string,
  knownPaths?: ReadonlySet<string>,
): string[] {
  const graph = parseAstModuleGraph(content, filePath, knownPaths);
  if (!graph) return [];
  const targets = new Set<string>();
  for (const call of graph.calls) {
    if (call.targetFile) targets.add(call.targetFile);
  }
  for (const binding of graph.imports) {
    if (binding.resolvedPath) targets.add(binding.resolvedPath);
  }
  return [...targets];
}

function walkAst(node: AstNode, visitor: (node: AstNode) => void): void {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && "type" in item) {
          walkAst(item as AstNode, visitor);
        }
      }
    } else if (value && typeof value === "object" && "type" in value) {
      walkAst(value as AstNode, visitor);
    }
  }
}

function asArray(value: unknown): AstNode[] {
  return Array.isArray(value) ? value as AstNode[] : [];
}

function readLine(node: AstNode): number {
  const loc = node.loc as { start?: { line?: number } } | undefined;
  const line = loc?.start?.line;
  return typeof line === "number" && line > 0 ? line : 1;
}

function readLocalName(spec: AstNode): string | null {
  const local = spec.local as AstNode | undefined;
  if (local?.type === "Identifier" && typeof local.name === "string") {
    return local.name;
  }
  return null;
}

function readCalleeName(callee: AstNode | undefined): string | null {
  if (!callee) return null;
  if (callee.type === "Identifier" && typeof callee.name === "string") {
    return callee.name;
  }
  if (
    callee.type === "MemberExpression" &&
    !callee.computed
  ) {
    const property = callee.property as AstNode | undefined;
    if (property?.type === "Identifier" && typeof property.name === "string") {
      const object = callee.object as AstNode | undefined;
      if (object?.type === "Identifier" && typeof object.name === "string") {
        return `${object.name}.${property.name}`;
      }
    }
  }
  return null;
}
