import { assertEquals } from "std/assert";
import type { RouteBlueprint } from "../../dto/blueprint/blueprint-document.dto.ts";
import { extractFactsFromFile } from "../facts/fact-extractors.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import { buildSecurityMatrixFromGraph } from "./graph-security-matrix.ts";
import { buildVisuDevGraphFromFacts } from "./fact-graph.mapper.ts";

const EMPLOYEES_SCOPE: RouteScope = {
  id: "POST /api/employees",
  method: "POST",
  path: "/api/employees",
  filePath: "routes/employees.ts",
  line: 2,
  relatedFiles: ["routes/employees.ts"],
};

const FIXTURE = `
app.post('/api/employees', async (c) => {
  const body = await c.req.json();
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'bad' }, 400);
  await supabase.from('employees').insert(parsed.data);
});
`;

function routeBlueprint(): RouteBlueprint {
  return {
    id: EMPLOYEES_SCOPE.id,
    method: EMPLOYEES_SCOPE.method,
    path: EMPLOYEES_SCOPE.path,
    filePath: EMPLOYEES_SCOPE.filePath,
    line: EMPLOYEES_SCOPE.line,
    pipeline: [],
    concepts: {
      "validation-gate": "missing",
      "db-write": "missing",
    },
  };
}

Deno.test("buildSecurityMatrixFromGraph uses graph node states for controls", () => {
  const facts = extractFactsFromFile("routes/employees.ts", FIXTURE);
  const graph = buildVisuDevGraphFromFacts(facts, [EMPLOYEES_SCOPE]);
  const matrix = buildSecurityMatrixFromGraph([routeBlueprint()], graph, []);

  assertEquals(matrix.length, 1);
  assertEquals(matrix[0]?.validation.state, "confirmed");
  assertEquals(matrix[0]?.db.state, "confirmed");
  assertEquals(matrix[0]?.auth.state, "unknown");
});

Deno.test("buildSecurityMatrixFromGraph keeps legacy role and audit cells from concepts", () => {
  const facts = extractFactsFromFile("routes/employees.ts", FIXTURE);
  const graph = buildVisuDevGraphFromFacts(facts, [EMPLOYEES_SCOPE]);
  const route = routeBlueprint();
  route.concepts["role-gate"] = "partial";
  route.concepts["audit-log"] = "confirmed";

  const matrix = buildSecurityMatrixFromGraph([route], graph, []);
  assertEquals(matrix[0]?.role.state, "partial");
  assertEquals(matrix[0]?.audit.state, "confirmed");
});

Deno.test("buildSecurityMatrixFromGraph falls back to concept row without scope", () => {
  const facts = extractFactsFromFile("routes/employees.ts", FIXTURE);
  const graph = buildVisuDevGraphFromFacts(facts, []);
  const route = routeBlueprint();
  route.concepts["validation-gate"] = "partial";

  const matrix = buildSecurityMatrixFromGraph([route], graph, []);
  assertEquals(matrix[0]?.validation.state, "partial");
  assertEquals(matrix[0]?.db.state, "unknown");
});
