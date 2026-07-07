/** Resolves relative TS/JS imports to repo-relative file paths. */

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];

export function extractImports(
  content: string,
  filePath: string,
  knownPaths?: ReadonlySet<string>,
): Array<{ specifier: string; resolvedPath: string | null }> {
  const results: Array<{ specifier: string; resolvedPath: string | null }> = [];
  const importRegex =
    /import\s+(?:type\s+)?(?:[\w*\s{},]+)\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    const specifier = match[1];
    results.push({
      specifier,
      resolvedPath: resolveImport(specifier, filePath, knownPaths),
    });
  }
  return results;
}

export function resolveImport(
  specifier: string,
  fromFile: string,
  knownPaths?: ReadonlySet<string>,
): string | null {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    return null;
  }

  const dir = fromFile.includes("/")
    ? fromFile.slice(0, fromFile.lastIndexOf("/"))
    : "";
  const base = normalizePath(
    specifier.startsWith("/") ? specifier.slice(1) : joinPath(dir, specifier),
  );

  const candidates: string[] = [];
  for (const ext of EXTENSIONS) {
    candidates.push(ext.startsWith("/") ? `${base}${ext}` : `${base}${ext}`);
  }
  candidates.push(base);

  if (knownPaths) {
    for (const candidate of candidates) {
      if (knownPaths.has(candidate)) return candidate;
    }
    return null;
  }

  return candidates[0] ?? null;
}

function joinPath(dir: string, rel: string): string {
  const parts = [...dir.split("/"), ...rel.split("/")].filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") stack.pop();
    else if (part !== ".") stack.push(part);
  }
  return stack.join("/");
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}
