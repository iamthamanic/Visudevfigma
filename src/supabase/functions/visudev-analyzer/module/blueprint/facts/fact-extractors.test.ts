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
