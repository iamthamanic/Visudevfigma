#!/usr/bin/env node
/**
 * Slice boundary import check (AST-based).
 * Product slices = top-level dirs under src/modules/ except shell.
 * Fails on NEW deep cross-slice or reverse utils/lib → module imports
 * not listed in .qa/architecture/boundary-baseline.txt.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "../..");
const BASELINE_FILE = path.join(ROOT, ".qa/architecture/boundary-baseline.txt");
const MODULES_ROOT = path.join(ROOT, "src/modules");

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function discoverSlices() {
  if (!fs.existsSync(MODULES_ROOT)) die("src/modules/ missing");
  const slices = fs
    .readdirSync(MODULES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "shell")
    .map((d) => d.name)
    .sort();
  if (slices.length === 0) die("No product slices discovered under src/modules/");
  return slices;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) die(`Missing baseline: ${BASELINE_FILE}`);
  const lines = fs.readFileSync(BASELINE_FILE, "utf8").split(/\r?\n/);
  const set = new Set();
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    set.add(`${parts[0]}\t${parts[1]}\t${parts[2]}`);
  }
  return set;
}

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

/** AST import / export-from / dynamic-import / side-effect import specifiers */
function extractSpecifiers(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const kind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, kind);
  const specs = [];

  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specs.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specs.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specs.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return specs;
}

function ownerSlice(relPosix, slices) {
  const m = relPosix.match(new RegExp(`^src/modules/(${slices.map(escapeRe).join("|")})/`));
  return m ? m[1] : "";
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isUnderModules(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join("/");
  return rel.startsWith("src/modules/");
}

/**
 * Resolve specifier to repo-relative posix path under src/modules/<slice>/…
 * Returns { slice, rel } or null.
 */
function resolveToSlice(fromRel, spec, slices) {
  let candidate = null;
  if (spec.startsWith("./") || spec.startsWith("../")) {
    const fromAbs = path.join(ROOT, fromRel);
    candidate = path.normalize(path.join(path.dirname(fromAbs), spec));
  } else {
    // Absolute-ish / alias forms pointing at modules
    const alias = spec.match(/^(?:@\/|src\/)?modules\/([^/]+)(\/.*)?$/);
    const loose = spec.match(/(?:^|\/)(?:src\/)?modules\/([^/]+)(\/.*)?$/);
    const hit = alias || loose;
    if (hit && slices.includes(hit[1])) {
      candidate = path.join(ROOT, "src/modules", hit[1] + (hit[2] || ""));
    }
  }
  if (!candidate || !isUnderModules(candidate)) return null;
  const rel = path.relative(ROOT, candidate).split(path.sep).join("/");
  const slice = ownerSlice(rel.endsWith("/") ? rel : rel + "/", slices) || ownerSlice(rel, slices);
  // ownerSlice needs trailing path — handle file without trailing slash
  const m = rel.match(new RegExp(`^src/modules/(${slices.map(escapeRe).join("|")})(?:/|$)`));
  if (!m) return null;
  return { slice: m[1], rel };
}

function isPublicEntry(slice, rel) {
  const root = `src/modules/${slice}`;
  return (
    rel === root ||
    rel === `${root}/index` ||
    rel === `${root}/index.ts` ||
    rel === `${root}/index.tsx` ||
    rel === `${root}/index.js` ||
    rel === `${root}/index.jsx`
  );
}

function main() {
  const slices = discoverSlices();
  const baseline = loadBaseline();
  const found = new Set();

  const productFiles = [];
  for (const slice of slices) {
    walkTsFiles(path.join(MODULES_ROOT, slice), productFiles);
  }
  const shellFiles = walkTsFiles(path.join(MODULES_ROOT, "shell"));
  const reverseFiles = [
    ...walkTsFiles(path.join(ROOT, "src/utils")),
    ...walkTsFiles(path.join(ROOT, "src/lib")),
  ];

  for (const abs of productFiles) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    const owner = ownerSlice(rel, slices);
    for (const spec of extractSpecifiers(abs)) {
      const resolved = resolveToSlice(rel, spec, slices);
      if (!resolved) continue;
      if (isPublicEntry(resolved.slice, resolved.rel)) continue;
      if (!owner || resolved.slice !== owner) {
        found.add(`deep\t${rel}\t${spec}`);
      }
    }
  }

  for (const abs of shellFiles) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    for (const spec of extractSpecifiers(abs)) {
      const resolved = resolveToSlice(rel, spec, slices);
      if (!resolved) continue;
      if (isPublicEntry(resolved.slice, resolved.rel)) continue;
      found.add(`deep\t${rel}\t${spec}`);
    }
  }

  for (const abs of reverseFiles) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    for (const spec of extractSpecifiers(abs)) {
      const resolved = resolveToSlice(rel, spec, slices);
      if (!resolved) continue;
      if (isPublicEntry(resolved.slice, resolved.rel)) continue;
      found.add(`reverse\t${rel}\t${spec}`);
    }
  }

  const foundList = [...found].sort();
  const baselineList = [...baseline].sort();
  const foundSet = new Set(foundList);
  const baseSet = new Set(baselineList);

  const neu = foundList.filter((x) => !baseSet.has(x));
  const stale = baselineList.filter((x) => !foundSet.has(x));

  if (neu.length) {
    console.log("❌ New slice-boundary import violations (not in baseline):");
    for (const v of neu) console.log(v);
    console.log("");
    console.log("Add only with an explicit cleanup/compat plan, or fix the import.");
    console.log(`Baseline: ${path.relative(ROOT, BASELINE_FILE)}`);
    process.exit(1);
  }

  console.log(`✅ No new deep/reverse slice-boundary imports (slices: ${slices.join(" ")})`);
  if (stale.length) {
    console.log("ℹ️  Baseline entries no longer present (safe to remove in cleanup issues):");
    for (const v of stale) console.log(v);
  }
}

main();
