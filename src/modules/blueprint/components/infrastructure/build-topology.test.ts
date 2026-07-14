/**
 * Tests for infrastructure topology node classification.
 */

import { describe, it, expect } from "vitest";
import { buildTopologyNodes, classifyTopologyTier } from "./build-topology.js";
import type { GraphCanvasNode } from "../../types";

describe("build-topology", () => {
  it("classifies infrastructure tiers", () => {
    expect(classifyTopologyTier({ id: "1", label: "Internet", kind: "runtime" })).toBe("internet");
    expect(
      classifyTopologyTier({ id: "2", label: "LOAD BALANCER / GATEWAY", kind: "runtime" }),
    ).toBe("loadBalancer");
    expect(classifyTopologyTier({ id: "3", label: "Web App", kind: "service" })).toBe("service");
    expect(classifyTopologyTier({ id: "4", label: "PostgreSQL", kind: "table" })).toBe("database");
    expect(classifyTopologyTier({ id: "5", label: "Payment API (Stripe)", kind: "external" })).toBe(
      "externalApi",
    );
    expect(classifyTopologyTier({ id: "6", label: "Prometheus", kind: "external" })).toBe(
      "monitoring",
    );
    expect(classifyTopologyTier({ id: "7", label: "symbol", kind: "symbol" })).toBeNull();
  });

  it("builds topology refs and synthetic monitoring/external nodes", () => {
    const nodes: GraphCanvasNode[] = [
      { id: "runtime:internet", label: "Internet", kind: "runtime" },
      { id: "runtime:lb", label: "LOAD BALANCER / GATEWAY", kind: "runtime" },
      { id: "service:web", label: "Web App", kind: "service" },
      { id: "service:api", label: "API Service", kind: "service" },
      { id: "service:worker", label: "Worker", kind: "service" },
      { id: "service:auth", label: "Auth Service", kind: "service" },
      { id: "table:pg", label: "PostgreSQL", kind: "table" },
      { id: "table:redis", label: "Redis", kind: "table" },
      { id: "table:storage", label: "STORAGE", kind: "table" },
      { id: "external:stripe", label: "Payment API (Stripe)", kind: "external" },
      { id: "external:sso", label: "SSO (OIDC)", kind: "external" },
      { id: "external:monitor", label: "Prometheus", kind: "external" },
    ];
    const topology = buildTopologyNodes(nodes);
    expect(topology.length).toBeGreaterThanOrEqual(10);
    expect(topology.some((node) => node.tier === "monitoring" && node.label === "Grafana")).toBe(
      true,
    );
    expect(
      topology.some((node) => node.tier === "externalApi" && node.label === "HR Datenanbieter"),
    ).toBe(true);
  });
});
