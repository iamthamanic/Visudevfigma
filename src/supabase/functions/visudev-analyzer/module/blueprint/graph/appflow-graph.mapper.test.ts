import { assertEquals } from "std/assert";
import type {
  AnalysisEdge,
  AnalysisGraph,
  AnalysisNode,
} from "../../dto/analysis/analysis-graph.dto.ts";
import { mapAnalysisGraphToVisuDevGraph } from "./appflow-graph.mapper.ts";

function routeNode(id: string, path: string): AnalysisNode {
  return {
    id,
    sourceScreenId: id.replace("node:", ""),
    kind: "route",
    subtype: "page",
    name: path,
    path,
    origin: "static",
    status: "confirmed",
    confidence: 90,
    evidenceIds: [`evidence:${id}`],
    uncertaintyReasons: [],
  };
}

function externalNode(id: string, name: string): AnalysisNode {
  return {
    id,
    sourceScreenId: "external",
    kind: "external",
    subtype: "page",
    name,
    origin: "static",
    status: "verified",
    confidence: 80,
    evidenceIds: [],
    uncertaintyReasons: [],
  };
}

function dataNode(id: string, name: string): AnalysisNode {
  return {
    id,
    sourceScreenId: "data",
    kind: "data",
    subtype: "page",
    name,
    origin: "static",
    status: "confirmed",
    confidence: 85,
    evidenceIds: [],
    uncertaintyReasons: [],
  };
}

function apiCallEdge(fromId: string, toId: string): AnalysisEdge {
  return {
    id: "edge:api:1",
    fromNodeId: fromId,
    toNodeId: toId,
    type: "api-call",
    origin: "static",
    status: "confirmed",
    confidence: 80,
    evidenceIds: [],
    uncertaintyReasons: [],
  };
}

function dbQueryEdge(fromId: string, toId: string): AnalysisEdge {
  return {
    id: "edge:db:1",
    fromNodeId: fromId,
    toNodeId: toId,
    type: "db-query",
    origin: "static",
    status: "confirmed",
    confidence: 80,
    evidenceIds: [],
    uncertaintyReasons: [],
  };
}

function navigateEdge(fromId: string, toId: string): AnalysisEdge {
  return {
    id: "edge:nav:1",
    fromNodeId: fromId,
    toNodeId: toId,
    type: "navigate",
    origin: "heuristic",
    status: "inferred",
    confidence: 50,
    evidenceIds: [],
    uncertaintyReasons: ["heuristic_only"],
  };
}

function baseGraph(
  nodes: AnalysisNode[],
  edges: AnalysisEdge[],
): AnalysisGraph {
  return {
    version: 1,
    nodes,
    edges,
    evidence: [],
    issues: [],
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      routeNodeCount: nodes.filter((node) => node.kind === "route").length,
      stateNodeCount: nodes.filter((node) => node.kind === "state").length,
      heuristicNodeCount: 0,
      heuristicEdgeCount: 0,
    },
  };
}

Deno.test("mapAnalysisGraphToVisuDevGraph maps route and api-call to calls edge", () => {
  const route = routeNode("node:home", "/");
  const external = externalNode("node:api", "Example API");
  const graph = mapAnalysisGraphToVisuDevGraph(
    baseGraph([route, external], [apiCallEdge(route.id, external.id)]),
  );

  assertEquals(graph.nodes.length, 2);
  assertEquals(graph.nodes[0]?.kind, "route");
  assertEquals(graph.nodes[1]?.kind, "external_api");
  assertEquals(graph.edges.length, 1);
  assertEquals(graph.edges[0]?.kind, "calls");
  assertEquals(graph.scopes.length, 1);
  assertEquals(graph.scopes[0]?.id, "appflow:node:home");
});

Deno.test("mapAnalysisGraphToVisuDevGraph maps db-query to reads edge", () => {
  const route = routeNode("node:users", "/users");
  const table = dataNode("node:users-table", "users");
  const graph = mapAnalysisGraphToVisuDevGraph(
    baseGraph([route, table], [dbQueryEdge(route.id, table.id)]),
  );

  assertEquals(graph.edges.length, 1);
  assertEquals(graph.edges[0]?.kind, "reads");
  assertEquals(
    graph.nodes.find((node) => node.kind === "table")?.label,
    "users",
  );
});

Deno.test("mapAnalysisGraphToVisuDevGraph skips navigation-only edges", () => {
  const home = routeNode("node:home", "/");
  const about = routeNode("node:about", "/about");
  const graph = mapAnalysisGraphToVisuDevGraph(
    baseGraph([home, about], [navigateEdge(home.id, about.id)]),
  );

  assertEquals(graph.edges.length, 0);
  assertEquals(graph.nodes.length, 2);
});

Deno.test("mapAnalysisGraphToVisuDevGraph skips state nodes in subset", () => {
  const graph = mapAnalysisGraphToVisuDevGraph(baseGraph([{
    id: "node:modal",
    sourceScreenId: "modal-1",
    kind: "state",
    subtype: "modal",
    name: "Create project",
    origin: "runtime-verified",
    status: "verified",
    confidence: 95,
    evidenceIds: [],
    uncertaintyReasons: [],
  }], []));

  assertEquals(graph.nodes.length, 0);
  assertEquals(graph.scopes.length, 0);
});
