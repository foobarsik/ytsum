interface WatchlistTermReviewPromptInput {
  transcript: string;
  description: string;
  language: string;
}

export function buildWatchlistTermReviewPrompt({
  transcript,
  description,
  language,
}: WatchlistTermReviewPromptInput): string {
  return `
You are reviewing noisy YouTube auto-subtitles before signal extraction.

Identify at most 12 suspicious technical terms that could materially affect analysis:
- acronyms;
- products and company names;
- standards and protocols;
- APIs, libraries, file names, and domains;
- terms near words such as standard, protocol, API, framework, or specification.

Hard rules:
- Never expand an acronym unless the expansion appears explicitly in the transcript or video description.
- Never replace a raw term using general model knowledge alone.
- The video description is source metadata and may verify a spelling or canonical term.
- If metadata clearly identifies a term that the transcript likely misheard, use status "corrected_asr_term" and explain the source match.
- If the exact term appears consistently in source text or metadata, use status "source_backed".
- Otherwise preserve the raw term, set canonicalTerm to null, status to "needs_verification", and verificationRequired to true.
- A plausible-sounding interpretation is not verification.
- Write contextExcerpt and notes in ${language}.

Return only JSON:
{
  "terms": [{
    "rawTerm": "string exactly as found in transcript",
    "termType": "acronym|product|protocol|api|company|library|file_or_domain|unknown",
    "contextExcerpt": "short source context",
    "asrRisk": "low|medium|high",
    "canonicalTerm": "source-backed term or null",
    "canonicalConfidence": "low|medium|high",
    "verificationRequired": true,
    "status": "needs_verification|source_backed|corrected_asr_term",
    "notes": "why this status is justified"
  }]
}

Video description:
<description>
${description || "No description available."}
</description>

Transcript:
<transcript>
${transcript}
</transcript>
  `.trim();
}
