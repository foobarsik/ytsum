import { describe, expect, it } from "vitest";
import { parseAIJson } from "./openrouter";

describe("OpenRouter JSON parsing", () => {
  it("parses fenced JSON with surrounding text", () => {
    expect(parseAIJson('Result:\n```json\n{"cleanedText":"## Heading\\n\\nText"}\n```')).toEqual({ cleanedText: "## Heading\n\nText" });
  });

  it("repairs common malformed JSON", () => {
    expect(parseAIJson("{cleanedText: 'Readable text',}" )).toEqual({ cleanedText: "Readable text" });
  });
});
