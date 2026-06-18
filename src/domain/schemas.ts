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

export const addPlaylistSchema = z.object({
  url: z.string().url(), title: z.string().max(120).optional(), mode: z.enum(["inbox", "learning", "research"]),
  summaryDepth: z.enum(["brief", "normal", "deep"]),
});

export type InboxAgentOutput = z.infer<typeof inboxAgentOutputSchema>;
export type LearningAgentOutput = z.infer<typeof learningAgentOutputSchema>;
export type ResearchAgentOutput = z.infer<typeof researchAgentOutputSchema>;
