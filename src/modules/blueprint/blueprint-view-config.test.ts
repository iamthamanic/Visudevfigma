import { describe, expect, it } from "vitest";
import {
  BLUEPRINT_VIEWS,
  getDefaultBlueprintView,
  getBlueprintViewLabel,
  parseBlueprintViewParam,
} from "./blueprint-view-config";

describe("blueprint-view-config", () => {
  it("defaults to diagnostics", () => {
    expect(getDefaultBlueprintView()).toBe("diagnostics");
  });

  it("parses valid view params", () => {
    expect(parseBlueprintViewParam("atlas")).toBe("atlas");
    expect(parseBlueprintViewParam("invalid")).toBe("diagnostics");
  });

  it("exposes seven German sidebar labels", () => {
    expect(BLUEPRINT_VIEWS).toHaveLength(7);
    expect(getBlueprintViewLabel("dependencies")).toBe("Abhängigkeiten");
    expect(getBlueprintViewLabel("diagnostics")).toBe("Diagnosen");
  });
});
