import type {
  AgentMode,
  PlaylistAnalysis,
  SummaryDepth,
  Video,
  WatchlistInsight,
  WatchlistTermReview,
} from "@/domain/types";
import type { SummaryLanguage } from "@/domain/summary-languages";

export interface YouTubePlaylistMetadata {
  id: string;
  title: string;
  description: string;
  videos: Video[];
  nextPageToken?: string;
}
export interface YouTubeMetadataProvider {
  getPlaylist(playlistId: string): Promise<YouTubePlaylistMetadata>;
}
export interface TranscriptResult {
  status: "available" | "unavailable" | "processing" | "failed";
  transcript?: string;
  reason?: string;
}
export interface TranscriptProvider {
  getTranscript(videoId: string): Promise<TranscriptResult>;
}
export interface AIProvider {
  analyzePlaylist(input: {
    mode: AgentMode;
    videos: Video[];
    depth: SummaryDepth;
  }): Promise<PlaylistAnalysis>;
  summarizeVideo(input: {
    video: Video;
    depth: SummaryDepth;
    language: SummaryLanguage;
  }): Promise<Pick<Video, "summary" | "keyPoints" | "actionItems">>;
  cleanTranscriptChunk(input: {
    text: string;
    part: number;
    total: number;
    language: SummaryLanguage;
  }): Promise<string>;
  inspectWatchlistTerms(input: {
    transcript: string;
    description: string;
    language: SummaryLanguage;
  }): Promise<WatchlistTermReview[]>;
  analyzeWatchlistVideo(input: {
    channelTitle: string;
    videoTitle: string;
    topic: string;
    transcript: string;
    terms: WatchlistTermReview[];
    priorInsights: WatchlistInsight[];
    language: SummaryLanguage;
  }): Promise<WatchlistInsight>;
  answerQuestion(input: {
    question: string;
    videos: Video[];
  }): Promise<{ answer: string; sourceVideoIds: string[] }>;
}
