import { assertEquals } from "std/assert";
import { analyzeFromFileEntries } from "./blueprint-pipeline.service.ts";

Deno.test("analyzeFromFileEntries builds routes from hono handler", () => {
  const content = `
app.post('/api/employees', async (c) => {
  const body = await c.req.json();
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'bad' }, 400);
  await supabase.from('employees').insert(parsed.data);
});
`;
  const doc = analyzeFromFileEntries({
    repo: "local:/tmp/test",
    branch: "local",
    commitSha: "local",
    fileEntries: [{ path: "routes/employees.ts", content }],
  });

  assertEquals(doc.routes.length >= 1, true);
  assertEquals(doc.filesAnalyzed, 1);
  assertEquals(doc.version, 1);
});
