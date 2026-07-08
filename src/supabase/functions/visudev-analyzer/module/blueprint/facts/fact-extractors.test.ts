import { assertEquals } from "std/assert";
import { extractFactsFromFile } from "./fact-extractors.ts";

Deno.test("extractFactsFromFile detects hono route and supabase write", () => {
  const content = `
app.post('/api/employees', async (c) => {
  const body = await c.req.json();
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'bad' }, 400);
  await supabase.from('employees').insert(parsed.data);
});
`;
  const facts = extractFactsFromFile("routes/employees.ts", content);
  const kinds = facts.map((fact) => fact.kind);
  assertEquals(kinds.includes("api-route"), true);
  assertEquals(kinds.includes("request-body-read"), true);
  assertEquals(kinds.includes("schema-safe-parse"), true);
  assertEquals(kinds.includes("db-write"), true);
});

Deno.test("extractFactsFromFile classifies hono context routes in routes.ts files", () => {
  const content = `
app.post('/api/employees', async (c) => {
  await supabase.from('employees').insert({});
});
`;
  const facts = extractFactsFromFile("routes/employees.routes.ts", content);
  const route = facts.find((fact) => fact.kind === "api-route");
  assertEquals(route?.metadata?.framework, "hono");
});

Deno.test("extractFactsFromFile classifies plain express app routes in routes files", () => {
  const content = `app.get('/health', handler);`;
  const facts = extractFactsFromFile(
    "app/modules/leaves/leaves.routes.ts",
    content,
  );
  const route = facts.find((fact) => fact.kind === "api-route");
  assertEquals(route?.metadata?.framework, "express");
});

Deno.test("extractFactsFromFile keeps hono routes when routes file imports hono", () => {
  const content = `
import { Hono } from 'hono';
const app = new Hono();
app.post('/api/items', (c) => c.json({ ok: true }));
`;
  const facts = extractFactsFromFile("routes/items.routes.ts", content);
  const route = facts.find((fact) => fact.kind === "api-route");
  assertEquals(route?.metadata?.framework, "hono");
});

Deno.test("extractFactsFromFile detects express router routes", () => {
  const content = `
export function createLeavesRoutes() {
  const router = Router();
  router.get('/me', handler);
  router.post('/', authorize('hr.calendar.leave.request'), handler);
  app.get('/health', handler);
  return router;
}
`;
  const facts = extractFactsFromFile(
    "app/modules/leaves/leaves.routes.ts",
    content,
  );
  const routes = facts.filter((fact) => fact.kind === "api-route");
  assertEquals(routes.length, 3);
  assertEquals(
    routes.some((r) =>
      r.metadata?.framework === "express" && r.metadata?.path === "/me"
    ),
    true,
  );
  assertEquals(
    routes.some((r) =>
      r.metadata?.framework === "express" &&
      r.metadata?.method === "GET" &&
      r.metadata?.path === "/health"
    ),
    true,
  );
  assertEquals(routes.some((r) => r.metadata?.method === "POST"), true);
});
