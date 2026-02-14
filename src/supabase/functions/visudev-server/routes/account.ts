/**
 * Account routes for visudev-server. Single responsibility: user account CRUD.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { getUserIdOptional } from "../lib/auth.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { parseParam, userIdParamSchema } from "../lib/params.ts";
import { updateAccountBodySchema } from "../lib/schemas/account.ts";

export const accountRouter = new Hono<{ Variables: AppDeps }>();

accountRouter.get("/:userId", async (c) => {
  try {
    const parsed = parseParam(c.req.param("userId"), userIdParamSchema);
    if (!parsed.ok) return c.json({ success: false, error: parsed.error }, 400);
    const userId = parsed.data;
    const kv = c.get("kv");
    const authUserId = await getUserIdOptional(c);
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const account = await kv.get(`account:${userId}`);
    return c.json({ success: true, data: account || {} });
  } catch (error) {
    c.get("logError")("Error fetching account.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

accountRouter.put("/:userId", async (c) => {
  try {
    const parsed = parseParam(c.req.param("userId"), userIdParamSchema);
    if (!parsed.ok) return c.json({ success: false, error: parsed.error }, 400);
    const userId = parsed.data;
    const kv = c.get("kv");
    const checkRateLimit = c.get("checkRateLimit");
    const authUserId = await getUserIdOptional(c);
    if (authUserId === null) {
      return c.json({ success: false, error: "Authentication required" }, 401);
    }
    if (authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    if (!(await checkRateLimit(`rate:account:${userId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, updateAccountBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as { displayName?: string; email?: string };
    const existing = (await kv.get(`account:${userId}`)) as
      | Record<string, unknown>
      | null;
    const base = (existing && typeof existing === "object"
      ? { ...existing }
      : {}) as Record<string, unknown>;
    if (body.displayName !== undefined) {
      base.displayName = body.displayName;
    }
    if (body.email !== undefined) {
      base.email = body.email;
    }
    const account = {
      ...base,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`account:${userId}`, account);
    return c.json({ success: true, data: account });
  } catch (error) {
    c.get("logError")("Error updating account.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
