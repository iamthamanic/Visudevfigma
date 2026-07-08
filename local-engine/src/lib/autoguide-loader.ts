/**
 * Dynamic loader for optional @autoguide/* workspace packages.
 * Location: local-engine/src/lib/autoguide-loader.ts
 */

import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type AutoGuideScannerModule = {
  scanSourceProject: (rootDir: string) => Promise<{
    routes: Array<{ route: string; filePath: string }>;
    elements: Array<{
      filePath: string;
      componentName?: string;
      handlerName?: string;
      dataDocKey?: string;
      dataDocValue?: string;
      missingAriaLabel?: boolean;
      line?: number;
    }>;
  }>;
  mergeScanResults: (
    source: {
      routes: Array<{ route: string; filePath: string }>;
      elements: Array<{
        filePath: string;
        componentName?: string;
        handlerName?: string;
        dataDocKey?: string;
        dataDocValue?: string;
        missingAriaLabel?: boolean;
        line?: number;
      }>;
    },
    runtime?: unknown,
  ) => {
    pages: Array<{ id: string; route: string; title: string }>;
    facts: Array<{
      id: string;
      key: string;
      value: unknown;
      confidence: number;
      provenance: Array<{ filePath?: string; source: string }>;
    }>;
  };
};

export type AutoGuidePackageStatus = {
  available: boolean;
  root: string | null;
  packages: {
    scanner: boolean;
    core: boolean;
  };
  message: string | null;
};

const PACKAGE_ENTRY = "dist/index.js";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveAutoGuideRoot(explicitRoot?: string): string | null {
  const trimmed = explicitRoot?.trim();
  if (trimmed) return path.resolve(trimmed);

  const sibling = path.resolve(process.cwd(), "../../../autoguide");
  return sibling;
}

async function importFromRoot(
  root: string,
  packageName: "scanner" | "core",
): Promise<unknown | null> {
  const entry = path.join(root, "packages", packageName, PACKAGE_ENTRY);
  if (!(await fileExists(entry))) return null;
  return import(pathToFileURL(entry).href);
}

async function importFromNodeModules(specifier: string): Promise<unknown | null> {
  try {
    return await import(specifier);
  } catch {
    return null;
  }
}

async function packageBuilt(root: string, packageName: "scanner" | "core"): Promise<boolean> {
  const entry = path.join(root, "packages", packageName, PACKAGE_ENTRY);
  return fileExists(entry);
}

async function nodeModuleExists(specifier: string): Promise<boolean> {
  try {
    const resolved = await import.meta.resolve(specifier, import.meta.url);
    return Boolean(resolved);
  } catch {
    return false;
  }
}

export async function detectAutoGuidePackages(
  explicitRoot?: string,
): Promise<AutoGuidePackageStatus> {
  const nodeScanner = await nodeModuleExists("@autoguide/scanner");
  if (nodeScanner) {
    const nodeCore = await nodeModuleExists("@autoguide/core");
    return {
      available: true,
      root: null,
      packages: { scanner: true, core: nodeCore },
      message: null,
    };
  }

  const root = resolveAutoGuideRoot(explicitRoot);
  if (!root || !(await fileExists(root))) {
    return {
      available: false,
      root: null,
      packages: { scanner: false, core: false },
      message: "Set VISUDEV_AUTOGUIDE_ROOT to a built @autoguide monorepo or link packages.",
    };
  }

  const scanner = await packageBuilt(root, "scanner");
  const core = await packageBuilt(root, "core");

  return {
    available: scanner,
    root,
    packages: { scanner, core },
    message: scanner ? null : `@autoguide/scanner not built under ${root}`,
  };
}

export async function loadAutoGuideScanner(explicitRoot?: string): Promise<AutoGuideScannerModule> {
  const status = await detectAutoGuidePackages(explicitRoot);
  if (!status.available) {
    throw new Error(status.message ?? "AutoGuide scanner packages are not available.");
  }

  const fromNode = await importFromNodeModules("@autoguide/scanner");
  if (fromNode) {
    return fromNode as AutoGuideScannerModule;
  }

  const root = status.root;
  if (!root) {
    throw new Error("AutoGuide root path missing after availability check.");
  }

  const fromRoot = await importFromRoot(root, "scanner");
  if (!fromRoot) {
    throw new Error(`Failed to import @autoguide/scanner from ${root}`);
  }

  return fromRoot as AutoGuideScannerModule;
}
