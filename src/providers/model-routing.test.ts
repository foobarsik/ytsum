import { describe, expect, it } from "vitest";
import { routeModel, taskForMode } from "./model-routing";
const config = { cheap: "cheap-model", default: "balanced-model", deep: "deep-model" };
describe("model routing", () => {
  it("routes task tiers from config", () => {
    expect(routeModel("triage", config)).toBe("cheap-model");
    expect(routeModel("summary", config)).toBe("balanced-model");
    expect(routeModel("synthesis", config)).toBe("deep-model");
  });
  it("uses synthesis for research", () => expect(taskForMode("research")).toBe("synthesis"));
  it("fails closed when missing", () =>
    expect(() => routeModel("summary", { ...config, default: "" })).toThrow("not configured"));
});
