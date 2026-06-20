import { z } from "zod";

export const recommendationSchema = z.object({
  videoId: z.string().min(1),
  label: z.string().min(1),
  reason: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  evidenceBasis: z.string().min(1),
});

export const inboxAgentOutputSchema = z.object({
  overview: z.string(), recommended: z.array(recommendationSchema), lowPriority: z.array(recommendationSchema),
  duplicates: z.array(z.string()), needsTranscript: z.array(z.string()), warnings: z.array(z.string()),
});

export const learningAgentOutputSchema = z.object({
  overview: z.string(), learningPath: z.array(recommendationSchema), prerequisites: z.array(z.string()),
  missingTopics: z.array(z.string()), exercises: z.array(z.string()), warnings: z.array(z.string()),
});

export const researchAgentOutputSchema = z.object({
  overview: z.string(), themes: z.array(z.string()), consensus: z.array(z.string()), disagreements: z.array(z.string()),
  recurringClaims: z.array(recommendationSchema), weakSignals: z.array(z.string()), claimsToVerify: z.array(z.string()),
  missingAngles: z.array(z.string()), warnings: z.array(z.string()),
});

function tolerantArray<T>(schema: z.ZodType<T>, maxItems: number) {
  return z.array(z.unknown()).catch([]).transform((items) => items.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }).slice(0, maxItems));
}

const watchlistScoreSchema = z.number().transform((value) => Math.min(5, Math.max(1, Math.round(value))));
const watchlistConfidenceSchema = z.enum(["low", "medium", "high"]).catch("low");
const watchlistSeveritySchema = z.enum(["low", "medium", "high"]).catch("low");

export const watchlistTermReviewSchema = z.object({
  rawTerm: z.string().min(1),
  termType: z.enum(["acronym", "product", "protocol", "api", "company", "library", "file_or_domain", "unknown"]).catch("unknown"),
  contextExcerpt: z.string().min(1),
  asrRisk: watchlistSeveritySchema,
  canonicalTerm: z.string().min(1).nullable().default(null),
  canonicalConfidence: watchlistConfidenceSchema,
  verificationRequired: z.boolean().default(true),
  status: z.enum(["needs_verification", "source_backed", "corrected_asr_term"]).catch("needs_verification"),
  notes: z.string().default(""),
});

export const watchlistTermReviewOutputSchema = z.object({
  terms: tolerantArray(watchlistTermReviewSchema, 12),
});

export const watchlistSignalCandidateSchema = z.object({
  claim: z.string().min(1),
  signalType: z.enum(["workflow_shift", "role_shift", "tooling_opportunity", "market_shift", "user_behavior_shift", "project_update", "historical_context", "generic_hype", "author_metadata", "recommendation"]).catch("generic_hype"),
  whyItMatters: z.string().min(1),
  whoIsAffected: z.preprocess((value) => typeof value === "string" ? [value] : value, z.array(z.string().min(1)).max(8)).catch([]),
  evidenceFromVideo: z.string().min(1),
  counterpoint: z.string().default("No counterpoint provided."),
  productOpportunity: z.string().default(""),
  confidence: watchlistConfidenceSchema,
  novelty: watchlistScoreSchema,
  specificity: watchlistScoreSchema,
  evidence: watchlistScoreSchema,
  actionability: watchlistScoreSchema,
  marketImpact: watchlistScoreSchema,
  hypeRisk: watchlistScoreSchema,
});

const watchlistClaimSchema = z.object({
  text: z.string().min(1),
  kind: z.enum(["factual", "prediction", "opinion"]).catch("opinion"),
  confidence: watchlistConfidenceSchema,
  evidenceBasis: z.string().default("Not provided."),
  isNew: z.boolean().default(false),
});

const watchlistPositionChangeSchema = z.object({
  topic: z.string().min(1),
  previousPosition: z.string().min(1),
  currentPosition: z.string().min(1),
  evidence: z.string().default("Not provided."),
  confidence: watchlistConfidenceSchema,
});

const watchlistRiskSignalSchema = z.object({
  signal: z.string().min(1), evidence: z.string().default("Not provided."), severity: watchlistSeveritySchema,
});

const watchlistEarlySignalSchema = z.object({
  signal: z.string().min(1), whyItMatters: z.string().default("Not provided."), evidence: z.string().default("Not provided."), confidence: watchlistConfidenceSchema,
});

export const watchlistInsightOutputSchema = z.object({
  overview: z.string().min(1),
  claims: tolerantArray(watchlistClaimSchema, 10),
  signals: tolerantArray(watchlistSignalCandidateSchema, 12),
  terms: tolerantArray(watchlistTermReviewSchema, 12),
  positionChanges: tolerantArray(watchlistPositionChangeSchema, 5),
  marketingSignals: tolerantArray(watchlistRiskSignalSchema, 5),
  reasoningRisks: tolerantArray(watchlistRiskSignalSchema, 5),
  qualitySignals: tolerantArray(watchlistRiskSignalSchema, 5),
  earlySignals: tolerantArray(watchlistEarlySignalSchema, 5),
  warnings: tolerantArray(z.string(), 10),
});

export const addPlaylistSchema = z.object({
  url: z.string().url(), title: z.string().max(120).optional(), mode: z.enum(["inbox", "learning", "research"]),
  summaryDepth: z.enum(["brief", "normal", "deep"]),
});

export type InboxAgentOutput = z.infer<typeof inboxAgentOutputSchema>;
export type LearningAgentOutput = z.infer<typeof learningAgentOutputSchema>;
export type ResearchAgentOutput = z.infer<typeof researchAgentOutputSchema>;
export type WatchlistInsightOutput = z.infer<typeof watchlistInsightOutputSchema>;
