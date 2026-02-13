/**
 * AppFlow create validation. Strict whitelist (flowId, screens, flows, framework)
 * to prevent mass assignment.
 */
import { z } from "zod";

const screenSchema = z.object({
  id: z.string().max(200),
  name: z.string().max(200).optional(),
  path: z.string().max(500).optional(),
  file: z.string().max(500).optional(),
  screenshotUrl: z.string().max(2000).optional(),
  screenshotStatus: z.enum(["none", "pending", "ok", "failed"]).optional(),
  filePath: z.string().max(500).optional(),
  type: z.enum(["page", "screen", "view"]).optional(),
  flows: z.array(z.string()).max(100).optional(),
  navigatesTo: z.array(z.string()).max(100).optional(),
  framework: z.string().max(100).optional(),
  componentCode: z.string().max(50_000).optional(),
  lastScreenshotCommit: z.string().max(100).optional(),
  depth: z.number().int().min(0).max(20).optional(),
});

const flowSchema = z.object({
  id: z.string().max(200),
  type: z.enum(["ui-event", "function-call", "api-call", "db-query"]),
  name: z.string().max(200),
  file: z.string().max(500),
  line: z.number().int().min(0),
  code: z.string().max(10_000),
  calls: z.array(z.string()).max(50).optional(),
  color: z.string().max(50).optional(),
});

export const createAppFlowBodySchema = z
  .object({
    flowId: z.string().uuid().optional(),
    screens: z.array(screenSchema).max(200).optional(),
    flows: z.array(flowSchema).max(200).optional(),
    framework: z.string().max(100).optional(),
  })
  .strict()
  .refine((obj) => JSON.stringify(obj).length <= 200_000, {
    message: "AppFlow payload too large",
  });
