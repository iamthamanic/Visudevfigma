/**
 * Account routes for visudev-server. Single responsibility: user account CRUD.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import { getUserIdOptional } from "../lib/auth.ts";
import { checkRateLimit } from "../lib/rate-limit.ts";
import { updateAccountBodySchema } from "../lib/schemas.ts";

export const accountRouter = new Hono();

accountRouter.get("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const authUserId = await getUserIdOptional(c);
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const account = await kv.get(`account:${userId}`);
    return c.json({ success: true, data: account || {} });
  } catch (error) {
    console.log(`Error fetching account: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

accountRouter.put("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const authUserId = await getUserIdOptional(c);
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    if (!(await checkRateLimit(`rate:account:${userId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const raw = await c.req.json();
    const parsed = updateAccountBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.message }, 400);
    }
    const body = parsed.data as Record<string, unknown>;
    const account = {
      ...body,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`account:${userId}`, account);
    return c.json({ success: true, data: account });
  } catch (error) {
    console.log(`Error updating account: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
