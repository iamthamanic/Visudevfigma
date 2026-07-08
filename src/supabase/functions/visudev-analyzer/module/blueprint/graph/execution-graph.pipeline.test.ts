import { assertEquals } from "std/assert";
import type { TechnicalConcept } from "../../dto/blueprint/blueprint-document.dto.ts";
import { extractFactsFromFile } from "../facts/fact-extractors.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import { buildPipelineFromExecutionGraph } from "./execution-graph.pipeline.ts";
import { buildVisuDevGraphFromFacts } from "./fact-graph.mapper.ts";

const EMPLOYEES_SCOPE: RouteScope = {
  id: "POST /api/employees",
  method: "POST",
  path: "/api/employees",
  filePath: "routes/employees.ts",
  line: 2,
  relatedFiles: ["routes/employees.ts"],
};

const EMPLOYEES_FIXTURE = `
app.post('/api/employees', async (c) => {
  const body = await c.req.json();
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'bad' }, 400);
  await supabase.from('employees').insert(parsed.data);
});
`;

const TEMPLATE_PIPELINE = [
  { id: "tpl:request", type: "request", label: "Request", state: "confirmed" },
  { id: "tpl:handler", type: "handler", label: "Handler", state: "confirmed" },
] as const;

function emptyConcepts(): Map<string, TechnicalConcept> {
  return new Map();
}

Deno.test("execution graph orders validation before handler before db write", () => {
  const facts = extractFactsFromFile("routes/employees.ts", EMPLOYEES_FIXTURE);
  const graph = buildVisuDevGraphFromFacts(facts, [EMPLOYEES_SCOPE]);
  const pipeline = buildPipelineFromExecutionGraph(
    EMPLOYEES_SCOPE,
    graph,
    emptyConcepts(),
    [...TEMPLATE_PIPELINE],
  );

  const types = pipeline.map((node) => node.type);
  assertEquals(types.includes("request"), true);
  assertEquals(types.includes("validation-gate"), true);
  assertEquals(types.includes("handler"), true);
  assertEquals(types.includes("db-write"), true);

  const validationIndex = types.indexOf("validation-gate");
  const handlerIndex = types.indexOf("handler");
  const dbIndex = types.indexOf("db-write");
  assertEquals(validationIndex < handlerIndex, true);
  assertEquals(handlerIndex < dbIndex, true);
});

Deno.test("execution graph orders auth before handler before external call", () => {
  const content = `
app.get('/api/profile', async (c) => {
  const user = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const res = await fetch('https://api.example.com/profile');
  return c.json(await res.json());
});
`;
  const routeScope: RouteScope = {
    id: "GET /api/profile",
    method: "GET",
    path: "/api/profile",
    filePath: "routes/profile.ts",
    line: 2,
    relatedFiles: ["routes/profile.ts"],
  };
  const facts = extractFactsFromFile("routes/profile.ts", content);
  const graph = buildVisuDevGraphFromFacts(facts, [routeScope]);
  const pipeline = buildPipelineFromExecutionGraph(
    routeScope,
    graph,
    emptyConcepts(),
    [...TEMPLATE_PIPELINE],
  );

  const types = pipeline.map((node) => node.type);
  const authIndex = types.indexOf("auth-gate");
  const handlerIndex = types.indexOf("handler");
  const externalIndex = types.indexOf("external-api");
  assertEquals(authIndex < handlerIndex, true);
  assertEquals(handlerIndex < externalIndex, true);
});

Deno.test("execution graph falls back to template when graph has no execution edges", () => {
  const graph = buildVisuDevGraphFromFacts([], [EMPLOYEES_SCOPE]);
  const pipeline = buildPipelineFromExecutionGraph(
    EMPLOYEES_SCOPE,
    graph,
    emptyConcepts(),
    [...TEMPLATE_PIPELINE],
  );
  assertEquals(pipeline, [...TEMPLATE_PIPELINE]);
});

Deno.test("execution graph falls back when route scope missing from graph", () => {
  const facts = extractFactsFromFile("routes/employees.ts", EMPLOYEES_FIXTURE);
  const graph = buildVisuDevGraphFromFacts(facts, []);
  const pipeline = buildPipelineFromExecutionGraph(
    EMPLOYEES_SCOPE,
    graph,
    emptyConcepts(),
    [...TEMPLATE_PIPELINE],
  );
  assertEquals(pipeline, [...TEMPLATE_PIPELINE]);
});
