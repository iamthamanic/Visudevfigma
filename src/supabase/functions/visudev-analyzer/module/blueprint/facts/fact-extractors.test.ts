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

Deno.test("extractFactsFromFile detects Prisma models in schema.prisma", () => {
  const content = `
generator client {
  provider = "prisma-client-js"
}
model Survey {
  id String @id
}
model Webhook {
  id String @id
}
`;
  const facts = extractFactsFromFile(
    "packages/database/schema.prisma",
    content,
  );
  const tables = facts.filter((f) => f.kind === "db-write").map((f) =>
    f.metadata?.table
  );
  assertEquals(tables.includes("Survey"), true);
  assertEquals(tables.includes("Webhook"), true);
  assertEquals(facts.every((f) => f.metadata?.framework === "prisma"), true);
});

Deno.test("extractFactsFromFile detects prisma this.prisma client calls", () => {
  const content =
    `const leaveRequest = await this.prisma.leaveRequest.create({ data });`;
  const facts = extractFactsFromFile(
    "app/modules/leaves/leaves.service.ts",
    content,
  );
  const write = facts.find((f) => f.kind === "db-write");
  assertEquals(write?.metadata?.table, "leaveRequest");
  assertEquals(write?.metadata?.framework, "prisma");
});

Deno.test("extractFactsFromFile detects multiline express router paths", () => {
  const content = `
export function createLeavesRoutes() {
  const router = Router();
  router.get(
    '/escalation-approvers',
    authorize('hr.admin.approvals.read'),
    handler,
  );
  return router;
}
`;
  const facts = extractFactsFromFile(
    "app/modules/leaves/leaves.routes.ts",
    content,
  );
  const routes = facts.filter((fact) => fact.kind === "api-route");
  assertEquals(routes.length, 1);
  assertEquals(routes[0]?.metadata?.path, "/escalation-approvers");
  assertEquals(routes[0]?.metadata?.method, "GET");
});

Deno.test("extractFactsFromFile detects express app.use mount prefixes", () => {
  const content = `
import { Router } from 'express';
const router = createLeavesRoutes();
app.use('/api/leaves', router);
`;
  const facts = extractFactsFromFile(
    "app/modules/leaves/index.ts",
    content,
  );
  const mount = facts.find((f) => f.kind === "route-mount");
  assertEquals(mount?.metadata?.path, "/api/leaves");
});

Deno.test("extractFactsFromFile detects Django urlpatterns and permissions", () => {
  const content = `
from rest_framework.permissions import IsAuthenticated
from django.urls import path, re_path

urlpatterns = [
    path("api/workspaces/", WorkspaceView.as_view()),
    path("api/projects/", ProjectViewSet.as_view({"get": "list"})),
    re_path(r"^api/issues/(?P<pk>[^/.]+)/$", IssueView.as_view()),
]

class WorkspaceView(APIView):
    permission_classes = [IsAuthenticated]
`;
  const facts = extractFactsFromFile("apps/api/plane/urls.py", content);
  const routes = facts.filter((f) => f.kind === "api-route");
  assertEquals(routes.length >= 3, true);
  assertEquals(
    routes.some((r) => r.metadata?.framework === "django"),
    true,
  );
  assertEquals(
    routes.some((r) => String(r.metadata?.path).includes(":pk")),
    true,
  );
  assertEquals(facts.some((f) => f.kind === "auth-check"), true);
});
