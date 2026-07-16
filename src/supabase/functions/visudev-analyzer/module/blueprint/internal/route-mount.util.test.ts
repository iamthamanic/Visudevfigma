import { assertEquals } from "std/assert";
import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import {
  buildExpressMountPrefixByDir,
  joinMountPrefix,
  lookupExpressMountPrefix,
} from "./route-mount.util.ts";

Deno.test("buildExpressMountPrefixByDir indexes unique same-dir mounts once", () => {
  const facts: CodeFact[] = [{
    id: "m1",
    kind: "route-mount",
    filePath: "app/modules/leaves/index.ts",
    line: 10,
    snippet: "app.use('/api/leaves', router)",
    metadata: { path: "/api/leaves", framework: "express" },
  }];
  const map = buildExpressMountPrefixByDir(facts);
  assertEquals(map.get("app/modules/leaves"), "/api/leaves");
  assertEquals(
    lookupExpressMountPrefix("app/modules/leaves/leaves.routes.ts", map),
    "/api/leaves",
  );
});

Deno.test("buildExpressMountPrefixByDir skips ambiguous multi-mount dirs", () => {
  const facts: CodeFact[] = [{
    id: "m1",
    kind: "route-mount",
    filePath: "app/modules/x/index.ts",
    line: 1,
    snippet: "app.use('/a', r1)",
    metadata: { path: "/a" },
  }, {
    id: "m2",
    kind: "route-mount",
    filePath: "app/modules/x/index.ts",
    line: 2,
    snippet: "app.use('/b', r2)",
    metadata: { path: "/b" },
  }];
  const map = buildExpressMountPrefixByDir(facts);
  assertEquals(map.has("app/modules/x"), false);
});

Deno.test("joinMountPrefix is idempotent when path already mounted", () => {
  assertEquals(joinMountPrefix("/api/leaves", "/me"), "/api/leaves/me");
  assertEquals(
    joinMountPrefix("/api/leaves", "/api/leaves/me"),
    "/api/leaves/me",
  );
  assertEquals(joinMountPrefix("/api/leaves", "/"), "/api/leaves");
});
