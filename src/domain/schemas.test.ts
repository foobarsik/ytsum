import { describe, expect, it } from "vitest";
import {
  inboxAgentOutputSchema,
  learningAgentOutputSchema,
  researchAgentOutputSchema,
  recommendationSchema,
  watchlistInsightOutputSchema,
} from "./schemas";
const rec = {
  videoId: "v1",
  label: "Watch",
  reason: "Relevant",
  confidence: "high",
  evidenceBasis: "Transcript",
};
describe("agent schemas", () => {
  it("validates recommendation contract", () =>
    expect(recommendationSchema.parse(rec)).toEqual(rec));
  it("rejects invalid confidence", () =>
    expect(() => recommendationSchema.parse({ ...rec, confidence: "certain" })).toThrow());
  it("accepts all three output shapes", () => {
    expect(
      inboxAgentOutputSchema.safeParse({
        overview: "x",
        recommended: [rec],
        lowPriority: [],
        duplicates: [],
        needsTranscript: [],
        warnings: [],
      }).success,
    ).toBe(true);
    expect(
      learningAgentOutputSchema.safeParse({
        overview: "x",
        learningPath: [rec],
        prerequisites: [],
        missingTopics: [],
        exercises: [],
        warnings: [],
      }).success,
    ).toBe(true);
    expect(
      researchAgentOutputSchema.safeParse({
        overview: "x",
        themes: [],
        consensus: [],
        disagreements: [],
        recurringClaims: [rec],
        weakSignals: [],
        claimsToVerify: [],
        missingAngles: [],
        warnings: [],
      }).success,
    ).toBe(true);
  });
});

describe("watchlist insight schema", () => {
  it("keeps valid sections when another generated item is malformed", () => {
    const parsed = watchlistInsightOutputSchema.parse({
      overview: "Review",
      claims: "not-an-array",
      signals: [{ whyItMatters: "Missing claim" }],
      reasoningRisks: [{ signal: "Unsupported conclusion", severity: "medium" }],
    });
    expect(parsed.claims).toEqual([]);
    expect(parsed.signals).toEqual([]);
    expect(parsed.reasoningRisks).toEqual([
      { signal: "Unsupported conclusion", evidence: "Not provided.", severity: "medium" },
    ]);
  });
});
