/**
 * Auth helpers for visudev-server. Single responsibility: JWT validation and project ownership checks.
 */
import { createClient } from "@jsr/supabase__supabase-js";
import { kv } from "./kv.ts";

export type ProjectRecord = Record<string, unknown> & { ownerId?: string };

export async function getUserIdOptional(
  c: { req: { header: (name: string) => string | undefined } },
): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return null;
  try {
    const supabase = createClient(url, serviceRole);
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch (e) {
    console.warn("[getUserIdOptional] auth.getUser failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

export async function requireProjectOwner(
  c: Parameters<typeof getUserIdOptional>[0],
  projectId: string,
): Promise<
  | { ok: true; project: ProjectRecord }
  | { ok: false; status: 403 | 404 }
> {
  const project = (await kv.get(`project:${projectId}`)) as
    | ProjectRecord
    | null;
  if (!project) return { ok: false, status: 404 };
  const ownerId = project.ownerId;
  const userId = await getUserIdOptional(c);
  if (userId === null) return { ok: false, status: 403 };
  if (ownerId != null && userId !== ownerId) return { ok: false, status: 403 };
  return { ok: true, project };
}
