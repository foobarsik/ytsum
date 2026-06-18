import { describe, expect, it } from "vitest";
import { chunkTranscript, formatTranscriptParagraphs } from "./transcript-format";

describe("transcript reading format", () => {
  it("groups sentences into readable paragraphs without losing text", () => {
    const text = "First sentence. Second sentence is longer. Third sentence.";
    const paragraphs = formatTranscriptParagraphs(text, 35);
    expect(paragraphs.length).toBeGreaterThan(1);
    expect(paragraphs.join(" ")).toBe(text);
  });

  it("chunks long unpunctuated captions", () => {
    expect(formatTranscriptParagraphs("one two three four five six", 10)).toEqual(["one two", "three four", "five six"]);
  });

  it("splits long transcripts into ordered bounded chunks", () => {
    const text = Array.from({ length: 40 }, (_, index) => `Sentence ${index}.`).join(" ");
    const chunks = chunkTranscript(text, 80);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 80)).toBe(true);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(text);
  });
});
