/**
 * CLI: stdin JSON { projectId, localPath, files: [{path, content}] }
 * stdout JSON { screens, flows, graph, quality, framework, analysisId, commitSha, filesAnalyzed }
 * Location: module/appflow/cli/analyze-local.ts
 */

import { analyzeAppflowFromFileEntries } from "../../services/appflow-pipeline.service.ts";

interface CliInput {
  projectId?: string;
  localPath?: string;
  files?: Array<{ path: string; content: string }>;
  fileLimit?: number;
}

async function readStdinText(): Promise<string> {
  const reader = Deno.stdin.readable.getReader();
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) parts.push(value);
  }
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return new TextDecoder().decode(merged);
}

async function main(): Promise<void> {
  const raw = await readStdinText();
  let input: CliInput;
  try {
    input = JSON.parse(raw) as CliInput;
  } catch {
    console.error("Invalid JSON on stdin");
    Deno.exit(1);
  }

  const files = Array.isArray(input.files) ? input.files : [];
  const localPath = String(input.localPath ?? "").trim();
  const projectId = String(input.projectId ?? "").trim();

  const result = analyzeAppflowFromFileEntries({
    projectId: projectId || undefined,
    localPath: localPath || undefined,
    fileEntries: files,
    fileLimit: input.fileLimit,
    commitSha: localPath ? undefined : "local",
  });

  const payload = JSON.stringify(result);
  await Deno.stdout.write(new TextEncoder().encode(payload));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  Deno.exit(1);
});
