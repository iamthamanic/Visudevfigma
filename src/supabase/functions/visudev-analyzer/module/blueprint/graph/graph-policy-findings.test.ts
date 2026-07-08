import { assertEquals } from "std/assert";
import type { BlueprintFinding } from "../../dto/blueprint/blueprint-document.dto.ts";
import { extractFactsFromFile } from "../facts/fact-extractors.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import { buildVisuDevGraphFromFacts } from "./fact-graph.mapper.ts";
import { attachGraphFindings } from "./graph-policy-findings.ts";

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

Deno.test("graph findings mark missing validation with control node and evidence", () => {
  const facts = extractFactsFromFile("routes/employees.ts", FIXTURE);
  const graph = buildVisuDevGraphFromFacts(facts, [EMPLOYEES_SCOPE]);
  const blueprintFindings: BlueprintFinding[] = [{
    id: "finding-1",
    ruleId: "web-api.validation-before-db-write",
    category: "security",
    severity: "high",
    scopeId: EMPLOYEES_SCOPE.id,
    message: "Runtime Validation fehlt vor DB Write.",
    expectedState: "Validation Gate confirmed vor DB Write",
    actualState: "Validation Gate missing",
    evidenceFactIds: facts
      .filter((fact) => fact.kind.startsWith("schema-"))
      .map((fact) => fact.id),
    confidence: 87,
  }];
  const enriched = attachGraphFindings(
    graph,
    [{
      id: EMPLOYEES_SCOPE.id,
      method: EMPLOYEES_SCOPE.method,
      path: EMPLOYEES_SCOPE.path,
      filePath: EMPLOYEES_SCOPE.filePath,
      line: EMPLOYEES_SCOPE.line,
      pipeline: [],
      concepts: {},
    }],
    [EMPLOYEES_SCOPE],
    facts,
    blueprintFindings,
  );

  const missing = enriched.findings.find((finding) =>
    finding.outcome === "missing"
  );
  assertEquals(Boolean(missing), true);
  assertEquals(missing?.scopeId, EMPLOYEES_SCOPE.id);
  assertEquals((missing?.expectedControlNodeId?.length ?? 0) > 0, true);
  assertEquals((missing?.evidenceIds.length ?? 0) > 0, true);
});

Deno.test("graph findings mark validation rule not applicable on GET route", () => {
  const getScope: RouteScope = {
    id: "GET /api/health",
    method: "GET",
    path: "/api/health",
    filePath: "routes/health.ts",
    line: 2,
    relatedFiles: ["routes/health.ts"],
  };
  const graph = buildVisuDevGraphFromFacts([], [getScope]);
  const enriched = attachGraphFindings(
    graph,
    [{
      id: getScope.id,
      method: getScope.method,
      path: getScope.path,
      filePath: getScope.filePath,
      line: getScope.line,
      pipeline: [],
      concepts: {},
    }],
    [getScope],
    [],
    [] as BlueprintFinding[],
  );

  const notApplicable = enriched.findings.filter((finding) =>
    finding.ruleId === "web-api.validation-before-db-write"
  );
  assertEquals(notApplicable.length, 1);
  assertEquals(notApplicable[0]?.outcome, "not_applicable");
  assertEquals(notApplicable[0]?.actualState, "n/a");
});
