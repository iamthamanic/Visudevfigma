/**
 * Unit tests for shared project migration helpers.
 * Location: local-engine/src/lib/project-migration.test.ts
 */

import { describe, expect, it } from "vitest";
import {
  metadataToLocalCreateInput,
  metadataToSupabaseCreateBody,
  stripSecretFields,
  supabaseRecordToMetadata,
  unwrapSupabaseApiPayload,
} from "./project-migration.js";

describe("stripSecretFields", () => {
  it("removes token fields from project records", () => {
    const clean = stripSecretFields({
      name: "Demo",
      github_access_token: "secret",
      supabase_anon_key: "anon",
    });
    expect(clean.name).toBe("Demo");
    expect(clean.github_access_token).toBeUndefined();
    expect(clean.supabase_anon_key).toBeUndefined();
  });
});

describe("supabaseRecordToMetadata", () => {
  it("maps supabase project fields to migration metadata", () => {
    const metadata = supabaseRecordToMetadata({
      id: "proj-1",
      name: "My App",
      github_repo: "user/repo",
      github_branch: "main",
      local_path: "/Users/me/app",
    });
    expect(metadata.name).toBe("My App");
    expect(metadata.githubRepo).toBe("user/repo");
    expect(metadata.localPath).toBe("/Users/me/app");
    expect(metadata.originalProjectId).toBe("proj-1");
  });
});

describe("metadata mappers", () => {
  it("creates local create input without secrets", () => {
    const input = metadataToLocalCreateInput({
      name: "Imported",
      repositoryUrl: "user/repo",
      localPath: "/Users/me/app",
    });
    expect(input).toEqual({
      name: "Imported",
      repositoryUrl: "user/repo",
      localPath: "/Users/me/app",
    });
  });

  it("creates supabase body without secrets", () => {
    const body = metadataToSupabaseCreateBody({
      name: "Imported",
      githubRepo: "user/repo",
      githubBranch: "main",
    });
    expect(body.github_repo).toBe("user/repo");
    expect(body.github_access_token).toBeUndefined();
  });
});

describe("unwrapSupabaseApiPayload", () => {
  it("unwraps success/data envelopes", () => {
    expect(unwrapSupabaseApiPayload({ success: true, data: { id: "1" } })).toEqual({ id: "1" });
    expect(unwrapSupabaseApiPayload({ ok: true, data: { id: "2" } })).toEqual({ id: "2" });
  });
});
