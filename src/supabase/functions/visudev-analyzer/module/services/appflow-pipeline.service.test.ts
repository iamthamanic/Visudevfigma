import { assertEquals } from "std/assert";
import { analyzeAppflowFromFileEntries } from "./appflow-pipeline.service.ts";

Deno.test("analyzeAppflowFromFileEntries extracts screens and flows from local files", () => {
  const content = `
export default function HomePage() {
  return <button onClick={handleClick}>Go</button>;
}

function handleClick() {
  fetch('/api/items');
}
`;

  const result = analyzeAppflowFromFileEntries({
    localPath: "/tmp/demo",
    fileEntries: [{ path: "src/pages/Home.tsx", content }],
    fileLimit: 10,
  });

  assertEquals(result.filesAnalyzed, 1);
  assertEquals(result.screens.length > 0, true);
  assertEquals(result.flows.length > 0, true);
  assertEquals(result.graph.nodes.length > 0, true);
});
