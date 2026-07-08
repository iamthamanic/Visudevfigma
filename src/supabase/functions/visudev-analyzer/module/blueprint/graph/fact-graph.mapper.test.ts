import { assertEquals } from "std/assert";
import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { extractFactsFromFile } from "../facts/fact-extractors.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import { buildVisuDevGraphFromFacts } from "./fact-graph.mapper.ts";

const ROUTE_FILE = "routes/employees.ts";
const EMPLOYEES_SCOPE_ID = "POST /api/employees";

const FIXTURE_CONTENT = `
app.post('/api/employees', async (c) => {
  const body = await c.req.json();
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'bad' }, 400);
  await supabase.from('employees').insert(parsed.data);
});
`;

Deno.test("buildVisuDevGraphFromFacts creates evidence for every fact", () => {
  const facts = extractFactsFromFile(ROUTE_FILE, FIXTURE_CONTENT);
  const graph = buildVisuDevGraphFromFacts(facts, []);
  assertEquals(graph.version, 1);
  assertEquals(graph.evidence.length, facts.length);
  for (const fact of facts) {
    assertEquals(
      graph.evidence.some((entry) => entry.factId === fact.id),
      true,
    );
  }
});

Deno.test("buildVisuDevGraphFromFacts maps route validation and db write", () => {
  const facts = extractFactsFromFile(ROUTE_FILE, FIXTURE_CONTENT);
  const routeScope: RouteScope = {
    id: EMPLOYEES_SCOPE_ID,
    method: "POST",
    path: "/api/employees",
    filePath: ROUTE_FILE,
    line: 2,
    relatedFiles: [ROUTE_FILE],
  };

  const graph = buildVisuDevGraphFromFacts(facts, [routeScope]);

  const routeNode = graph.nodes.find((node) => node.kind === "route");
  assertEquals(routeNode?.label, "POST /api/employees");
  assertEquals(routeNode?.state, "confirmed");

  const validationNode = graph.nodes.find((node) => node.kind === "validation");
  assertEquals(validationNode?.state, "confirmed");

  const tableNode = graph.nodes.find((node) => node.kind === "table");
  assertEquals(tableNode?.label, "employees");

  const writeEdge = graph.edges.find((edge) => edge.kind === "writes");
  assertEquals(writeEdge?.fromNodeId, routeNode?.id);
  assertEquals(writeEdge?.toNodeId, tableNode?.id);

  const validatesEdge = graph.edges.find((edge) => edge.kind === "validates");
  assertEquals(validatesEdge?.fromNodeId, routeNode?.id);
  assertEquals(validatesEdge?.toNodeId, validationNode?.id);

  assertEquals(graph.scopes.length, 1);
  assertEquals(graph.scopes[0].kind, "route");
  assertEquals(graph.scopes[0].id, EMPLOYEES_SCOPE_ID);
  assertEquals(graph.scopes[0].nodeIds.includes(routeNode!.id), true);
});

Deno.test("buildVisuDevGraphFromFacts rejects malformed facts before mapping", () => {
  const facts = [{ id: "", kind: "db-read" }, null] as unknown as CodeFact[];
  const graph = buildVisuDevGraphFromFacts(facts, []);
  assertEquals(graph.evidence.length, 0);
  assertEquals(graph.nodes.length, 0);
});

Deno.test("buildVisuDevGraphFromFacts keeps evidence for unknown fact kinds", () => {
  const facts: CodeFact[] = [{
    id: "custom-1",
    kind: "future-kind",
    filePath: "routes/x.ts",
    line: 1,
    snippet: "const x = 1",
    metadata: {},
  }];
  const graph = buildVisuDevGraphFromFacts(facts, []);
  assertEquals(graph.evidence.length, 1);
  assertEquals(graph.evidence[0].factId, "custom-1");
  assertEquals(graph.evidence[0].subjectId.startsWith("unmapped:"), true);
});

Deno.test("buildVisuDevGraphFromFacts maps auth and external api facts", () => {
  const content = `
app.get('/api/profile', async (c) => {
  const user = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const res = await fetch('https://api.example.com/profile');
  return c.json(await res.json());
});
`;
  const facts = extractFactsFromFile("routes/profile.ts", content);
  const profileFile = "routes/profile.ts";
  const profileScopeId = "GET /api/profile";
  const routeScope: RouteScope = {
    id: profileScopeId,
    method: "GET",
    path: "/api/profile",
    filePath: profileFile,
    line: 2,
    relatedFiles: [profileFile],
  };

  const graph = buildVisuDevGraphFromFacts(facts, [routeScope]);

  const authNode = graph.nodes.find((node) => node.kind === "auth");
  assertEquals(authNode?.state, "confirmed");

  const externalNode = graph.nodes.find((node) => node.kind === "external_api");
  assertEquals(externalNode?.state, "confirmed");

  assertEquals(graph.edges.some((edge) => edge.kind === "authenticates"), true);
  assertEquals(graph.edges.some((edge) => edge.kind === "calls"), true);
});

Deno.test("mapUnscopedFacts resets route context per file", () => {
  const fileA = "routes/a.ts";
  const fileB = "routes/b.ts";
  const contentA = `
app.get('/api/a', async () => {
  await supabase.from('table_a').select();
});
`;
  const contentB = `
app.get('/api/b', async () => {
  await supabase.from('table_b').select();
});
`;
  const facts = [
    ...extractFactsFromFile(fileA, contentA),
    ...extractFactsFromFile(fileB, contentB),
  ];
  const graph = buildVisuDevGraphFromFacts(facts, []);

  const routeNodes = graph.nodes.filter((node) => node.kind === "route");
  assertEquals(routeNodes.length, 2);

  const tableB = graph.nodes.find((node) =>
    node.kind === "table" && node.label === "table_b"
  );
  const routeB = routeNodes.find((node) => node.label === "GET /api/b");
  assertEquals(tableB !== undefined, true);
  assertEquals(routeB !== undefined, true);
  const readEdge = graph.edges.find((edge) =>
    edge.kind === "reads" && edge.toNodeId === tableB!.id
  );
  assertEquals(readEdge?.fromNodeId, routeB!.id);
});

Deno.test("buildVisuDevGraphFromFacts maps auth facts without route scopes", () => {
  const content = `
app.get('/api/profile', async (c) => {
  const user = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const res = await fetch('https://api.example.com/profile');
  return c.json(await res.json());
});
`;
  const facts = extractFactsFromFile("routes/profile.ts", content);
  const graph = buildVisuDevGraphFromFacts(facts, []);

  assertEquals(graph.nodes.some((node) => node.kind === "auth"), true);
  assertEquals(graph.nodes.some((node) => node.kind === "external_api"), true);
  assertEquals(graph.edges.some((edge) => edge.kind === "authenticates"), true);
  assertEquals(graph.edges.some((edge) => edge.kind === "calls"), true);
});
