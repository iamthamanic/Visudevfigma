import { assertEquals } from "std/assert";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import {
  validateRouteScope,
  validateRouteScopes,
} from "./route-scope.validate.ts";

Deno.test("validateRouteScope rejects non-string filePath", () => {
  const scope = {
    id: "GET /api/x",
    method: "GET",
    path: "/api/x",
    filePath: 42,
    line: 1,
    relatedFiles: [],
  } as unknown as RouteScope;
  assertEquals(validateRouteScope(scope, new Set()), null);
});

Deno.test("validateRouteScope rejects non-string method or path", () => {
  const scope = {
    id: "GET /api/x",
    method: 123,
    path: "/api/x",
    filePath: "routes/x.ts",
    line: 1,
    relatedFiles: [],
  } as unknown as RouteScope;
  assertEquals(validateRouteScope(scope, new Set()), null);
});

Deno.test("validateRouteScopes drops malformed scopes", () => {
  const valid: RouteScope = {
    id: "GET /api/ok",
    method: "GET",
    path: "/api/ok",
    filePath: "routes/ok.ts",
    line: 2,
    relatedFiles: ["routes/ok.ts"],
  };
  const invalid = {
    id: "POST /api/bad",
    method: "POST",
    path: "/api/bad",
    filePath: null,
    line: 3,
    relatedFiles: [],
  } as unknown as RouteScope;
  const result = validateRouteScopes([valid, invalid]);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "GET /api/ok");
});
