export const agentModes = ["inbox", "learning", "research"] as const;
export type AgentMode = (typeof agentModes)[number];
export type SummaryDepth = "brief" | "normal" | "deep";
export type Confidence = "low" | "medium" | "high";
export type TranscriptStatus = "available" | "unavailable" | "processing" | "failed" | "manually_added";
export type Priority = "recommended" | "low" | "unclear";

export interface Recommendation {
  videoId: string;
  label: string;
  reason: string;
  confidence: Confidence;
  evidenceBasis: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  publishedAt: string;
  thumbnail: string;
  transcriptStatus: TranscriptStatus;
  transcript?: string;
  cleanedTranscript?: string;
  transcriptCleanedAt?: string;
  transcriptEditVersion?: number;
  transcriptEditLanguage?: import("./summary-languages").SummaryLanguage;
  priority: Priority;
  priorityReason: string;
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  summaryLanguage?: import("./summary-languages").SummaryLanguage;
}

export interface PlaylistAnalysis {
  mode: AgentMode;
  overview: string;
  recommended: Recommendation[];
  lowPriority: Recommendation[];
  sections: { title: string; items: string[] }[];
  warnings: string[];
}

export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  sources: { videoId: string; title: string }[];
  createdAt: string;
}

export interface Playlist {
  id: string;
  youtubePlaylistId: string;
  title: string;
  description: string;
  mode: AgentMode;
  summaryDepth: SummaryDepth;
  status: "ready" | "analyzing" | "partial" | "failed";
  isDemo: boolean;
  videos: Video[];
  analysis: PlaylistAnalysis;
  analysisGeneratedAt?: string;
  questions: QuestionAnswer[];
  createdAt: string;
}
