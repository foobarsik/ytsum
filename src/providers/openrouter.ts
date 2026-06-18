import OpenAI from "openai";
import { AppError } from "@/domain/errors";
import { inboxAgentOutputSchema, learningAgentOutputSchema, researchAgentOutputSchema } from "@/domain/schemas";
import type { PlaylistAnalysis } from "@/domain/types";
import { summaryLanguageName } from "@/domain/summary-languages";
import type { AIProvider } from "./contracts";
import { modelConfigFromEnv, routeModel, taskForMode } from "./model-routing";

export class OpenRouterProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string, baseURL = "https://openrouter.ai/api/v1") {
    this.client = new OpenAI({ apiKey, baseURL, timeout: 45_000, maxRetries: 1 });
  }

  private async json(model: string, prompt: string): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4_000,
    });
    const content = response.choices[0]?.message.content;
    if (!content) throw new AppError("INVALID_AI_OUTPUT", "OpenRouter returned an empty response.", true);
    try { return JSON.parse(content); } catch { throw new AppError("INVALID_AI_OUTPUT", "OpenRouter returned invalid JSON.", true); }
  }

  async analyzePlaylist({ mode, videos }: Parameters<AIProvider["analyzePlaylist"]>[0]): Promise<PlaylistAnalysis> {
    const usable = videos.filter((v) => v.transcript).map((v) => ({ id: v.id, title: v.title, transcript: v.transcript?.slice(0, 30_000) }));
    const raw = await this.json(routeModel(taskForMode(mode), modelConfigFromEnv()), `Analyze this playlist in ${mode} mode. Do not judge videos without transcripts. Return only JSON matching the requested mode contract. Videos: ${JSON.stringify(usable)}`);
    if (mode === "inbox") { const out = inboxAgentOutputSchema.parse(raw); return { mode, overview: out.overview, recommended: out.recommended, lowPriority: out.lowPriority, sections: [{ title: "Possible duplicates", items: out.duplicates }, { title: "Needs transcript", items: out.needsTranscript }], warnings: out.warnings }; }
    if (mode === "learning") { const out = learningAgentOutputSchema.parse(raw); return { mode, overview: out.overview, recommended: out.learningPath, lowPriority: [], sections: [{ title: "Prerequisites", items: out.prerequisites }, { title: "Missing topics", items: out.missingTopics }, { title: "Exercises", items: out.exercises }], warnings: out.warnings }; }
    const out = researchAgentOutputSchema.parse(raw); return { mode, overview: out.overview, recommended: out.recurringClaims, lowPriority: [], sections: [{ title: "Themes", items: out.themes }, { title: "Consensus", items: out.consensus }, { title: "Disagreements", items: out.disagreements }, { title: "Claims to verify", items: out.claimsToVerify }, { title: "Missing angles", items: out.missingAngles }], warnings: out.warnings };
  }

  async summarizeVideo({ video, depth, language }: Parameters<AIProvider["summarizeVideo"]>[0]) {
    if (!video.transcript) throw new AppError("TRANSCRIPT_UNAVAILABLE", "Add a transcript before generating a summary.");
    const depthInstruction = depth === "brief" ? "Keep the summary concise." : depth === "deep" ? "Provide a detailed summary that preserves important nuance." : "Use moderate detail.";
    const raw = await this.json(routeModel("summary", modelConfigFromEnv()), `Summarize this transcript as JSON with summary:string, keyPoints:string[], actionItems:string[]. Write every field in ${summaryLanguageName(language)}. ${depthInstruction} Never invent timestamps or quotes. ${video.transcript}`) as { summary?: string; keyPoints?: string[]; actionItems?: string[] };
    if (!raw.summary || !Array.isArray(raw.keyPoints)) throw new AppError("INVALID_AI_OUTPUT", "OpenRouter returned an invalid summary.", true);
    return { summary: raw.summary, keyPoints: raw.keyPoints, actionItems: raw.actionItems ?? [] };
  }

  async answerQuestion({ question, videos }: Parameters<AIProvider["answerQuestion"]>[0]) {
    const sources = videos.filter((v) => v.summary || v.transcript).map((v) => ({ id: v.id, title: v.title, material: v.summary ?? v.transcript?.slice(0, 20_000) }));
    const raw = await this.json(routeModel("summary", modelConfigFromEnv()), `Answer only from these materials. If insufficient, say so. Return JSON {answer:string,sourceVideoIds:string[]}. Question: ${question}. Materials: ${JSON.stringify(sources)}`) as { answer?: string; sourceVideoIds?: string[] };
    if (!raw.answer || !Array.isArray(raw.sourceVideoIds)) throw new AppError("INVALID_AI_OUTPUT", "OpenRouter returned an invalid answer.", true);
    return { answer: raw.answer, sourceVideoIds: raw.sourceVideoIds };
  }
}
