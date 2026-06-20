export const agentModes = ["inbox", "learning", "research"] as const;
export type AgentMode = (typeof agentModes)[number];
export type SummaryDepth = "brief" | "normal" | "deep";
export type Confidence = "low" | "medium" | "high";
export type TranscriptStatus =
  | "available"
  | "unavailable"
  | "processing"
  | "failed"
  | "manually_added";
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
  youtubeNextPageToken?: string;
  youtubeHasMore?: boolean;
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

export type WatchlistSignalSeverity = "low" | "medium" | "high";
export type WatchlistClaimKind = "factual" | "prediction" | "opinion";
export type WatchlistSignalType =
  | "workflow_shift"
  | "role_shift"
  | "tooling_opportunity"
  | "market_shift"
  | "user_behavior_shift"
  | "project_update"
  | "historical_context"
  | "generic_hype"
  | "author_metadata"
  | "recommendation";
export type WatchlistTermType =
  | "acronym"
  | "product"
  | "protocol"
  | "api"
  | "company"
  | "library"
  | "file_or_domain"
  | "unknown";
export type WatchlistTermVerificationStatus =
  | "needs_verification"
  | "source_backed"
  | "corrected_asr_term";

export interface WatchlistTermReview {
  rawTerm: string;
  termType: WatchlistTermType;
  contextExcerpt: string;
  asrRisk: WatchlistSignalSeverity;
  canonicalTerm: string | null;
  canonicalConfidence: Confidence;
  verificationRequired: boolean;
  status: WatchlistTermVerificationStatus;
  notes: string;
}

export interface WatchlistClaim {
  text: string;
  kind: WatchlistClaimKind;
  confidence: Confidence;
  evidenceBasis: string;
  isNew: boolean;
}

export interface WatchlistRiskSignal {
  signal: string;
  evidence: string;
  severity: WatchlistSignalSeverity;
}

export interface WatchlistEarlySignal {
  signal: string;
  whyItMatters: string;
  evidence: string;
  confidence: Confidence;
}

export interface WatchlistPositionChange {
  topic: string;
  previousPosition: string;
  currentPosition: string;
  evidence: string;
  confidence: Confidence;
}

export interface WatchlistSignal {
  claim: string;
  signalType: WatchlistSignalType;
  whyItMatters: string;
  whoIsAffected: string[];
  evidenceFromVideo: string;
  counterpoint: string;
  productOpportunity: string;
  confidence: Confidence;
  novelty: number;
  specificity: number;
  evidence: number;
  actionability: number;
  marketImpact: number;
  hypeRisk: number;
  score: number;
  verificationStatus?: WatchlistTermVerificationStatus | "no_risky_terms";
  evidenceLevel?: string;
  sourceFragility?: string;
}

export interface WatchlistInsight {
  overview: string;
  claims: WatchlistClaim[];
  signals?: WatchlistSignal[];
  terms?: WatchlistTermReview[];
  positionChanges: WatchlistPositionChange[];
  marketingSignals: WatchlistRiskSignal[];
  reasoningRisks: WatchlistRiskSignal[];
  qualitySignals: WatchlistRiskSignal[];
  earlySignals: WatchlistEarlySignal[];
  warnings: string[];
  model?: string;
  generatedAt: string;
}

export interface WatchlistVideo {
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  transcriptStatus: TranscriptStatus;
  insight?: WatchlistInsight;
}

export interface WatchlistChannel {
  id: string;
  youtubeChannelId: string;
  uploadsPlaylistId: string;
  title: string;
  description: string;
  thumbnail: string;
  topic: string;
  addedAt: string;
  lastCheckedAt?: string;
  videos: WatchlistVideo[];
}

export interface WeeklyDigest {
  from: string;
  to: string;
  channelCount: number;
  videoCount: number;
  processedCount: number;
  signals: Array<WatchlistSignal & { channelTitle: string; videoTitle: string; youtubeId: string }>;
  productOpportunities: Array<{
    opportunity: string;
    signal: string;
    channelTitle: string;
    videoTitle: string;
    youtubeId: string;
  }>;
  newClaims: Array<
    WatchlistClaim & { channelTitle: string; videoTitle: string; youtubeId: string }
  >;
  positionChanges: Array<
    WatchlistPositionChange & { channelTitle: string; videoTitle: string; youtubeId: string }
  >;
  marketingSignals: Array<
    WatchlistRiskSignal & { channelTitle: string; videoTitle: string; youtubeId: string }
  >;
  reasoningRisks: Array<
    WatchlistRiskSignal & { channelTitle: string; videoTitle: string; youtubeId: string }
  >;
  earlySignals: Array<
    WatchlistEarlySignal & { channelTitle: string; videoTitle: string; youtubeId: string }
  >;
}
