import { describe, expect, it } from "vitest";
import { parseAIJson, rankWatchlistSignals } from "./openrouter";

describe("OpenRouter JSON parsing", () => {
  it("parses fenced JSON with surrounding text", () => {
    expect(parseAIJson('Result:\n```json\n{"cleanedText":"## Heading\\n\\nText"}\n```')).toEqual({ cleanedText: "## Heading\n\nText" });
  });

  it("repairs common malformed JSON", () => {
    expect(parseAIJson("{cleanedText: 'Readable text',}" )).toEqual({ cleanedText: "Readable text" });
  });
});

describe("Watchlist signal ranking", () => {
  const base = {
    whyItMatters: "It changes the development workflow.", whoIsAffected: ["Developers"], evidenceFromVideo: "Explicit workflow description.", counterpoint: "Still early.", productOpportunity: "Agent orchestration", confidence: "medium" as const,
    novelty: 4, specificity: 4, evidence: 3, actionability: 4, marketImpact: 4, hypeRisk: 1,
  };

  it("keeps decision signals and removes hype and near-duplicates", () => {
    const ranked = rankWatchlistSignals([
      { ...base, claim: "Developers are moving from direct prompts to agent workflow design.", signalType: "workflow_shift" },
      { ...base, claim: "Developer work moves from direct prompting toward designing agent workflows.", signalType: "workflow_shift" },
      { ...base, claim: "AI changes software forever.", signalType: "generic_hype", hypeRisk: 5 },
    ]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({ signalType: "workflow_shift", score: 15 });
  });

  it("preserves an unverified raw term but blocks its product opportunity", () => {
    const ranked = rankWatchlistSignals([
      { ...base, claim: "OMD is emerging as an agent registration standard.", evidenceFromVideo: "The sponsor calls OMD a standard.", signalType: "tooling_opportunity" },
    ], [{ rawTerm: "OMD", termType: "acronym", contextExcerpt: "OMD standard", asrRisk: "high", canonicalTerm: null, canonicalConfidence: "low", verificationRequired: true, status: "needs_verification", notes: "No source-backed expansion." }]);
    expect(ranked[0]).toMatchObject({ verificationStatus: "needs_verification", productOpportunity: "" });
  });
});
