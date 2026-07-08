/** Snippet redaction helpers for Blueprint export boundaries. */

export const MAX_SNIPPET_LEN = 120;

/** Redacts secrets and PII from arbitrary text before export. */
export function redactPiiInText(text: string): string {
  let result = text;
  result = result.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***");
  result = result.replace(
    /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/gi,
    "$1:***",
  );
  result = result.replace(
    /['"]?[xX]-api-[kK]ey['"]?\s*:\s*['"][^'"]+['"]/g,
    '"x-api-key": "***"',
  );
  result = result.replace(
    /\bapiKey\s*[:=]\s*['"][^'"]+['"]/gi,
    'apiKey: "***"',
  );
  result = result.replace(
    /['"][^'"]*(?:key|secret|token|password)[^'"]*['"]\s*:\s*['"][^'"]{8,}['"]/gi,
    (match) => {
      const key = match.split(":")[0]?.trim() ?? '"key"';
      return `${key}: "***"`;
    },
  );
  result = result.replace(
    /\b[A-Z][A-Z0-9_]*(?:SECRET|KEY|TOKEN|PASSWORD|ROLE)[A-Z0-9_]*\s*=\s*['"][^'"]+['"]/g,
    (match) => {
      const key = match.split("=")[0]?.trim() ?? "SECRET";
      return `${key}= "***"`;
    },
  );
  result = result.replace(/https?:\/\/[^\s'"]+/gi, "https://***");
  result = result.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "***@***");
  result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****");
  result = result.replace(/\b(?:\d[ -]*?){13,16}\b/g, "****");
  result = result.replace(/\+?\d[\d\s().-]{7,}\d/g, "***");
  result = result.replace(
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    "***.***.***.***",
  );
  return result;
}

export function sanitizeSnippetForExport(snippet: string): string {
  const text = redactPiiInText(snippet.trim());
  if (text.length > MAX_SNIPPET_LEN) {
    return `${text.slice(0, MAX_SNIPPET_LEN)}…`;
  }
  return text;
}

export function sanitizeUrlForExport(url: unknown): string {
  if (typeof url !== "string" || url.trim().length === 0) {
    return "https://***";
  }
  return url.replace(/https?:\/\/[^\s'"]+/gi, "https://***");
}
