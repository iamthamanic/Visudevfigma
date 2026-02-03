/**
 * VisuDEV Edge Function: Preview
 *
 * Calls external Preview Runner to build/run app from repo; stores preview URL/status in KV.
 * Routes: POST /preview/start, GET /preview/status, POST /preview/stop
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@jsr/supabase__supabase-js";

const KV_TABLE = "kv_store_edf036ef";

const kvClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

async function kvGet(key: string): Promise<unknown> {
  const supabase = kvClient();
  const { data, error } = await supabase
    .from(KV_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const supabase = kvClient();
  const { error } = await supabase.from(KV_TABLE).upsert({ key, value });
  if (error) throw new Error(error.message);
}

type PreviewState = {
  runId: string;
  status: "starting" | "ready" | "failed" | "stopped";
  previewUrl?: string;
  error?: string;
  startedAt: string;
  expiresAt?: string;
};

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// POST /preview/start — body: { projectId, repo?, branchOrCommit? } (repo/branch from body if project not in KV)
app.post("/preview/start", async (c) => {
  try {
    const runnerUrl = Deno.env.get("PREVIEW_RUNNER_URL");
    if (!runnerUrl) {
      return c.json(
        { success: false, error: "PREVIEW_RUNNER_URL not configured" },
        503,
      );
    }

    const body = await c.req.json().catch(() => ({}));
    const projectId = body.projectId as string | undefined;
    if (!projectId) {
      return c.json(
        { success: false, error: "projectId is required" },
        400,
      );
    }

    let repo = body.repo as string | undefined;
    let branch = (body.branchOrCommit as string) ?? "main";
    const project = await kvGet(`project:${projectId}`) as Record<string, unknown> | null;
    if (project) {
      repo = (project.github_repo as string) ?? repo;
      branch = (project.github_branch as string) ?? branch;
    }
    if (!repo) {
      return c.json(
        { success: false, error: "repo (or project with github_repo) is required" },
        400,
      );
    }

    const runnerRes = await fetch(`${runnerUrl.replace(/\/$/, "")}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo,
        branchOrCommit: branch,
        projectId,
      }),
    });

    const runnerText = await runnerRes.text();
    if (!runnerRes.ok) {
      console.error("Runner start failed", runnerRes.status, runnerText);
      return c.json(
        { success: false, error: `Runner error: ${runnerRes.status}` },
        502,
      );
    }

    let runnerData: { success?: boolean; runId?: string; status?: string };
    try {
      runnerData = JSON.parse(runnerText) as typeof runnerData;
    } catch {
      console.error("Runner returned invalid JSON", runnerText.slice(0, 200));
      return c.json(
        { success: false, error: "Preview Runner returned invalid response (not JSON). Is the Runner running and reachable?" },
        502,
      );
    }
    const runId = runnerData.runId ?? "";
    const status = (runnerData.status as PreviewState["status"]) ?? "starting";

    const previewState: PreviewState = {
      runId,
      status,
      startedAt: new Date().toISOString(),
    };
    await kvSet(`preview:${projectId}`, previewState);

    return c.json({
      success: true,
      runId,
      status,
    });
  } catch (e) {
    console.error("preview/start", e);
    return c.json(
      { success: false, error: e instanceof Error ? e.message : "Internal error" },
      500,
    );
  }
});

// GET /preview/status?projectId=xxx
app.get("/preview/status", async (c) => {
  try {
    const projectId = c.req.query("projectId");
    if (!projectId) {
      return c.json(
        { success: false, error: "projectId is required" },
        400,
      );
    }

    const stored = await kvGet(`preview:${projectId}`) as PreviewState | null;
    if (!stored) {
      return c.json({
        success: true,
        status: "idle",
        previewUrl: undefined,
        error: undefined,
      });
    }

    const runnerUrl = Deno.env.get("PREVIEW_RUNNER_URL");
    if (stored.status === "starting" && runnerUrl && stored.runId) {
      try {
        const statusRes = await fetch(
          `${runnerUrl.replace(/\/$/, "")}/status/${stored.runId}`,
        );
        const statusText = await statusRes.text();
        if (statusRes.ok) {
          let data: { status?: string; previewUrl?: string; error?: string } | null = null;
          try {
            data = JSON.parse(statusText) as NonNullable<typeof data>;
          } catch {
            console.error("Runner status returned invalid JSON", statusText.slice(0, 200));
          }
          if (data !== null) {
            const newStatus = (data.status as PreviewState["status"]) ?? stored.status;
            const updated: PreviewState = {
              ...stored,
              status: newStatus,
              previewUrl: data.previewUrl ?? stored.previewUrl,
              error: data.error ?? stored.error,
            };
            await kvSet(`preview:${projectId}`, updated);
            return c.json({
              success: true,
              status: updated.status,
              previewUrl: updated.previewUrl,
              error: updated.error,
              startedAt: updated.startedAt,
              expiresAt: updated.expiresAt,
            });
          }
        }
      } catch (_e) {
        // keep stored state
      }
    }

    return c.json({
      success: true,
      status: stored.status,
      previewUrl: stored.previewUrl,
      error: stored.error,
      startedAt: stored.startedAt,
      expiresAt: stored.expiresAt,
    });
  } catch (e) {
    console.error("preview/status", e);
    return c.json(
      { success: false, error: e instanceof Error ? e.message : "Internal error" },
      500,
    );
  }
});

// POST /preview/stop — body: { projectId }
app.post("/preview/stop", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const projectId = body.projectId as string | undefined;
    if (!projectId) {
      return c.json(
        { success: false, error: "projectId is required" },
        400,
      );
    }

    const stored = await kvGet(`preview:${projectId}`) as PreviewState | null;
    if (!stored) {
      return c.json({ success: true, status: "stopped" });
    }

    const runnerUrl = Deno.env.get("PREVIEW_RUNNER_URL");
    if (runnerUrl && stored.runId) {
      try {
        await fetch(`${runnerUrl.replace(/\/$/, "")}/stop/${stored.runId}`, {
          method: "POST",
        });
      } catch (_e) {
        // continue to update KV
      }
    }

    const updated: PreviewState = {
      ...stored,
      status: "stopped",
    };
    await kvSet(`preview:${projectId}`, updated);

    return c.json({ success: true, status: "stopped" });
  } catch (e) {
    console.error("preview/stop", e);
    return c.json(
      { success: false, error: e instanceof Error ? e.message : "Internal error" },
      500,
    );
  }
});

Deno.serve(app.fetch);
