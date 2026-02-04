/**
 * AST-based extraction of navigation targets (navigate, router.push, Link, NavLink, a href).
 * Uses @babel/parser; falls back to null on parse errors so callers can use regex.
 */

import * as babelParser from "@babel/parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BabelNode = any;

const parse = (babelParser as { default?: (code: string, opts: object) => BabelNode; parse?: (code: string, opts: object) => BabelNode }).default ?? (babelParser as { parse: (code: string, opts: object) => BabelNode }).parse;

export interface AstNavigationResult {
  navigatesTo: string[];
  linkNodes: { pathOrRef: string; line: number }[];
}

const NAVIGATION_CALLEES = new Set([
  "navigate",
  "navigateTo",
  "redirect",
  "push",
  "replace",
  "history.push",
  "history.replace",
]);
const ROUTER_OBJECTS = new Set(["router", "navigate", "history"]);

function getCalleeName(callee: BabelNode): string | null {
  if (!callee) return null;
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression") {
    const obj = callee.object;
    const prop = callee.property;
    if (obj?.type === "Identifier" && prop?.type === "Identifier") {
      return `${obj.name}.${prop.name}`;
    }
  }
  return null;
}

function getStringFromNode(node: BabelNode): string | null {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral") {
    if (node.quasis?.length === 1 && node.expressions?.length === 0) {
      return node.quasis[0]?.value?.raw ?? null;
    }
    return "dynamic";
  }
  if (node.type === "Identifier") return "dynamic";
  return null;
}

function isAbsolutePath(s: string): boolean {
  return s.startsWith("/") && !s.startsWith("//") && !s.toLowerCase().startsWith("/javascript:");
}

function walk(
  node: BabelNode,
  result: AstNavigationResult,
  visitor: (n: BabelNode) => void,
): void {
  if (!node || typeof node !== "object") return;
  visitor(node);
  const keys = Object.keys(node);
  for (const key of keys) {
    if (key === "loc" || key === "start" || key === "end" || key === "leadingComments" || key === "trailingComments") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && item.type) walk(item, result, visitor);
      }
    } else if (value && typeof value === "object" && value.type) {
      walk(value, result, visitor);
    }
  }
}

export function extractNavigationFromAst(content: string, _filePath: string): AstNavigationResult | null {
  let ast: BabelNode;
  try {
    ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return null;
  }

  const result: AstNavigationResult = { navigatesTo: [], linkNodes: [] };
  const seen = new Set<string>();

  walk(ast, result, (node) => {
    const line = node.loc?.start?.line ?? 0;

    if (node.type === "CallExpression") {
      const calleeName = getCalleeName(node.callee);
      if (!calleeName) return;
      const isNav =
        NAVIGATION_CALLEES.has(calleeName) ||
        (calleeName === "push" && node.callee?.object && ROUTER_OBJECTS.has(node.callee.object.name)) ||
        (calleeName === "replace" && node.callee?.object && ROUTER_OBJECTS.has(node.callee.object.name));
      if (!isNav) return;
      const firstArg = node.arguments?.[0];
      const path = getStringFromNode(firstArg);
      if (path && isAbsolutePath(path) && !seen.has(path)) {
        seen.add(path);
        result.navigatesTo.push(path);
        result.linkNodes.push({ pathOrRef: path, line });
      } else if (path === "dynamic") {
        result.linkNodes.push({ pathOrRef: "dynamic", line });
      }
    }

    if (node.type === "JSXOpeningElement") {
      const name = node.name?.name ?? node.name?.property?.name;
      const isLink = name === "Link" || name === "NavLink";
      const isAnchor = name === "a";
      if (!isLink && !isAnchor) return;
      const attrName = isLink ? "to" : "href";
      const attr = node.attributes?.find((a: BabelNode) => a.name?.name === attrName);
      const valueNode = attr?.value;
      let path: string | null = null;
      if (valueNode?.type === "StringLiteral") path = valueNode.value;
      if (valueNode?.type === "JSXExpressionContainer" && valueNode.expression) {
        path = getStringFromNode(valueNode.expression);
      }
      if (path && isAbsolutePath(path) && !seen.has(path)) {
        seen.add(path);
        result.navigatesTo.push(path);
        result.linkNodes.push({ pathOrRef: path, line });
      } else if (path === "dynamic") {
        result.linkNodes.push({ pathOrRef: "dynamic", line });
      }
    }
  });

  return result;
}

export interface ReactRouterRoute {
  path: string;
  componentName: string;
}

/** Extract React Router routes from AST (<Route path element> and { path, element } config). */
export function extractReactRouterRoutesFromAst(content: string): ReactRouterRoute[] | null {
  let ast: BabelNode;
  try {
    ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return null;
  }

  const routes: ReactRouterRoute[] = [];
  const seen = new Set<string>();

  function getAttr(node: BabelNode, name: string): string | null {
    const attr = node.attributes?.find((a: BabelNode) => a.name?.name === name);
    if (!attr?.value) return null;
    if (attr.value.type === "StringLiteral") return attr.value.value;
    if (attr.value.type === "JSXExpressionContainer" && attr.value.expression?.type === "StringLiteral") {
      return attr.value.expression.value;
    }
    return null;
  }

  function getElementComponentName(node: BabelNode): string | null {
    if (!node?.expression) return null;
    const expr = node.expression;
    if (expr.type === "JSXElement" && expr.openingElement?.name) {
      const name = expr.openingElement.name;
      return name.name ?? name.property?.name ?? null;
    }
    if (expr.type === "Identifier") return expr.name;
    return null;
  }

  function getObjProp(node: BabelNode, key: string): BabelNode | null {
    const prop = node.properties?.find((p: BabelNode) => p.key?.name === key || p.key?.value === key);
    return prop?.value ?? null;
  }

  function getStringFromNode(node: BabelNode): string | null {
    if (!node) return null;
    if (node.type === "StringLiteral") return node.value;
    if (node.type === "TemplateLiteral" && node.quasis?.length === 1 && !node.expressions?.length) {
      return node.quasis[0]?.value?.raw ?? null;
    }
    return null;
  }

  walk(ast, { navigatesTo: [], linkNodes: [] }, (node) => {
    if (node.type === "JSXOpeningElement" && node.name?.name === "Route") {
      const path = getAttr(node, "path");
      const elementAttr = node.attributes?.find((a: BabelNode) => a.name?.name === "element");
      let componentName: string | null = null;
      if (elementAttr?.value?.type === "JSXExpressionContainer") {
        const inner = elementAttr.value.expression;
        if (inner?.type === "JSXElement" && inner.openingElement?.name) {
          componentName = inner.openingElement.name.name ?? inner.openingElement.name.property?.name ?? null;
        }
      }
      if (path && componentName) {
        const key = `${path}:${componentName}`;
        if (!seen.has(key)) {
          seen.add(key);
          routes.push({ path, componentName });
        }
      }
    }

    if (node.type === "ObjectExpression") {
      const pathVal = getObjProp(node, "path");
      const elementVal = getObjProp(node, "element");
      const path = pathVal ? getStringFromNode(pathVal) : null;
      let componentName: string | null = null;
      if (elementVal?.type === "JSXElement" && elementVal.openingElement?.name) {
        componentName = elementVal.openingElement.name.name ?? elementVal.openingElement.name.property?.name ?? null;
      }
      if (path && componentName) {
        const key = `${path}:${componentName}`;
        if (!seen.has(key)) {
          seen.add(key);
          routes.push({ path, componentName });
        }
      }
    }
  });

  return routes.length > 0 ? routes : null;
}

export interface AstUiEventFlow {
  id: string;
  type: "ui-event";
  name: string;
  file: string;
  line: number;
  code: string;
  calls: string[];
  color: string;
}

const UI_EVENT_ATTRS = [
  "onClick",
  "onSubmit",
  "onChange",
  "onKeyPress",
  "onFocus",
  "onBlur",
  "onPress",
  "onTouchStart",
];

/** Extract UI events (buttons, onClick etc.) from JSX via AST. Returns flows for ui-event type. */
export function extractUiEventsFromAst(content: string, filePath: string): AstUiEventFlow[] | null {
  let ast: BabelNode;
  try {
    ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return null;
  }

  const flows: AstUiEventFlow[] = [];
  const seen = new Set<string>();

  function getHandlerRef(attrValue: BabelNode): string | null {
    if (!attrValue) return null;
    if (attrValue.type === "JSXExpressionContainer" && attrValue.expression) {
      const expr = attrValue.expression;
      if (expr.type === "Identifier") return expr.name;
      if (expr.type === "CallExpression" && expr.callee?.type === "Identifier") return expr.callee.name;
      return "handler";
    }
    return null;
  }

  walk(ast, { navigatesTo: [], linkNodes: [] }, (node) => {
    if (node.type !== "JSXOpeningElement") return;
    const name = node.name?.name ?? node.name?.property?.name;
    const line = node.loc?.start?.line ?? 0;
    const roleAttr = node.attributes?.find((a: BabelNode) => a.name?.name === "role");
    const role = roleAttr?.value?.type === "StringLiteral" ? roleAttr.value.value : null;
    const isButton = name === "button" || role === "button";

    for (const eventName of UI_EVENT_ATTRS) {
      const attr = node.attributes?.find((a: BabelNode) => a.name?.name === eventName);
      if (!attr) continue;
      const handlerRef = getHandlerRef(attr.value) ?? "handler";
      const id = `${filePath}:${line}:event:${eventName}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const code = content.split("\n")[line - 1]?.trim() ?? "";
      flows.push({
        id,
        type: "ui-event",
        name: eventName,
        file: filePath,
        line,
        code,
        calls: [],
        color: "#03ffa3",
      });
    }

    if (isButton && flows.some((f) => f.file === filePath && f.line === line)) return;
    if (isButton) {
      const id = `${filePath}:${line}:button`;
      if (!seen.has(id)) {
        seen.add(id);
        const code = content.split("\n")[line - 1]?.trim() ?? "";
        flows.push({
          id,
          type: "ui-event",
          name: "button",
          file: filePath,
          line,
          code,
          calls: [],
          color: "#03ffa3",
        });
      }
    }
  });

  return flows.length > 0 ? flows : null;
}

/** Function scope for call-graph: name and line range (start/end). */
interface FunctionScope {
  name: string;
  startLine: number;
  endLine: number;
  flowId: string;
}

/**
 * Extract call graph from AST: for each function (by flow id), list of callee names.
 * Used to fill CodeFlow.calls. Returns null on parse error.
 */
export function extractCallGraphFromAst(
  content: string,
  filePath: string,
): Record<string, string[]> | null {
  let ast: BabelNode;
  try {
    ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return null;
  }

  const functions: FunctionScope[] = [];
  const callSites: { line: number; calleeName: string }[] = [];

  walk(ast, { navigatesTo: [], linkNodes: [] }, (node) => {
    if (node.type === "FunctionDeclaration" && node.id?.name) {
      const start = node.loc?.start?.line ?? 0;
      const end = node.loc?.end?.line ?? start;
      functions.push({
        name: node.id.name,
        startLine: start,
        endLine: end,
        flowId: `${filePath}:${start}:function:${node.id.name}`,
      });
      return;
    }
    if (node.type === "VariableDeclarator" && node.init && node.id?.type === "Identifier") {
      const initNode = node.init;
      if (
        initNode.type === "FunctionExpression" ||
        initNode.type === "ArrowFunctionExpression"
      ) {
        const name = node.id.name;
        const start = node.loc?.start?.line ?? initNode.loc?.start?.line ?? 0;
        const end = initNode.loc?.end?.line ?? node.loc?.end?.line ?? start;
        functions.push({
          name,
          startLine: start,
          endLine: end,
          flowId: `${filePath}:${start}:function:${name}`,
        });
      }
    }
    if (node.type === "CallExpression") {
      const calleeName = getCalleeName(node.callee);
      if (calleeName) {
        const line = node.loc?.start?.line ?? 0;
        callSites.push({ line, calleeName });
      }
    }
  });

  const callsByFlowId = new Map<string, Set<string>>();
  const sortedFunctions = [...functions].sort(
    (a, b) =>
      a.endLine - a.startLine - (b.endLine - b.startLine) || a.startLine - b.startLine,
  );

  for (const { line, calleeName } of callSites) {
    const containing = sortedFunctions.find(
      (f) => line >= f.startLine && line <= f.endLine,
    );
    if (!containing) continue;
    let set = callsByFlowId.get(containing.flowId);
    if (!set) {
      set = new Set<string>();
      callsByFlowId.set(containing.flowId, set);
    }
    set.add(calleeName);
  }

  const result: Record<string, string[]> = {};
  callsByFlowId.forEach((set, flowId) => {
    result[flowId] = Array.from(set);
  });
  return Object.keys(result).length > 0 ? result : null;
}
