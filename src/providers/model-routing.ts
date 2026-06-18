import type { AgentMode } from "@/domain/types";

export type ModelTask = "triage" | "summary" | "synthesis";
export interface ModelConfig { cheap: string; default: string; deep: string; }

export function modelConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ModelConfig {
  return { cheap: env.AI_MODEL_CHEAP ?? "", default: env.AI_MODEL_DEFAULT ?? "", deep: env.AI_MODEL_DEEP ?? "" };
}

export function routeModel(task: ModelTask, config: ModelConfig): string {
  const model = task === "triage" ? config.cheap : task === "synthesis" ? config.deep : config.default;
  if (!model) throw new Error(`Model for ${task} is not configured`);
  return model;
}

export function taskForMode(mode: AgentMode): ModelTask { return mode === "research" ? "synthesis" : "triage"; }
