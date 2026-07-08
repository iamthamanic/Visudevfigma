/** Safe graph id normalization for VisuDevGraph mappers. */

import {
  normalizeGraphLabel,
  normalizeHttpMethod,
  normalizeRoutePath,
  normalizeTableName,
} from "../internal/route-normalize.util.ts";

export {
  normalizeGraphLabel,
  normalizeHttpMethod,
  normalizeRoutePath,
  normalizeTableName,
};

const MAX_ID_LEN = 80;
const MAX_ID_COLLISION_ATTEMPTS = 10_000;

function hashShort(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function sanitizeIdBase(value: string): string {
  const trimmed = value.trim().slice(0, MAX_ID_LEN);
  const sanitized = trimmed.replace(/[^a-zA-Z0-9]+/g, "-").replace(
    /^-|-$/g,
    "",
  );
  return sanitized.slice(0, MAX_ID_LEN);
}

export function createUniqueGraphId(
  prefix: string,
  raw: string,
  registry: Set<string>,
  stemCounters?: Map<string, number>,
): string {
  const base = sanitizeIdBase(raw);
  const stem = base.length > 0 ? base : `fact-${hashShort(raw)}`;
  const stemKey = `${prefix}:${stem}`;
  let counter = stemCounters?.get(stemKey) ?? 0;
  let candidate = "";

  do {
    counter += 1;
    if (counter > MAX_ID_COLLISION_ATTEMPTS) {
      throw new Error(
        `VisuDevGraph id collision limit exceeded for prefix ${prefix}`,
      );
    }
    candidate = composeGraphId(prefix, stem, counter, raw);
  } while (registry.has(candidate));

  stemCounters?.set(stemKey, counter);
  registry.add(candidate);
  return candidate;
}

function composeGraphId(
  prefix: string,
  stem: string,
  counter: number,
  raw: string,
): string {
  const uniqueTail = counter > 1 ? `~${hashShort(`${raw}-${counter}`)}` : "";
  const maxStemLen = Math.max(
    1,
    MAX_ID_LEN - prefix.length - 1 - uniqueTail.length,
  );
  const truncatedStem = stem.slice(0, maxStemLen);
  return `${prefix}-${truncatedStem}${uniqueTail}`.slice(0, MAX_ID_LEN);
}

export function routeNodeIdForScope(
  scopeId: string,
  registry: Set<string>,
  stemCounters?: Map<string, number>,
): string {
  return createUniqueGraphId("node-route", scopeId, registry, stemCounters);
}
