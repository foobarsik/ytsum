import type { AgentMode, Playlist, PlaylistAnalysis, Video } from "@/domain/types";

const thumbnails = ["#f5f5f4", "#fff7ed", "#e7e5e4", "#fafaf9"];

function video(id: string, title: string, channel: string, index: number, summary: string, priority: Video["priority"] = "recommended"): Video {
  return {
    id, youtubeId: id, title, channel, duration: `${12 + index * 7}:${index % 2 ? "18" : "42"}`, publishedAt: `2025-0${(index % 8) + 1}-12`, thumbnail: thumbnails[index % thumbnails.length],
    transcriptStatus: index === 3 ? "unavailable" : "available",
    transcript: index === 3 ? undefined : `[Demo fixture transcript] ${title}. ${summary} The speaker explains the evidence, limitations, and a practical example.`,
    priority: index === 3 ? "unclear" : priority,
    priorityReason: index === 3 ? "Unclear because no transcript is available." : priority === "low" ? "Overlaps with a stronger, more current source." : "Directly supports the playlist's main objective with concrete evidence.",
    summary: index === 3 ? undefined : summary,
    keyPoints: index === 3 ? undefined : ["Defines the core idea", "Shows a concrete implementation", "Names important limitations"],
    actionItems: index === 3 ? undefined : ["Compare the approach with your current workflow", "Test the smallest useful version"],
  };
}

const modeSections: Record<AgentMode, PlaylistAnalysis["sections"]> = {
  inbox: [{ title: "Possible duplicates", items: ["Two introductory videos cover the same fundamentals."] }, { title: "Needs transcript", items: ["One video cannot be assessed beyond its metadata."] }],
  learning: [{ title: "Prerequisites", items: ["Basic JavaScript", "Familiarity with HTTP APIs"] }, { title: "Missing topics", items: ["Deployment monitoring", "Evaluation datasets"] }, { title: "Exercises", items: ["Build a structured-output prompt", "Create a five-item evaluation set"] }],
  research: [{ title: "Consensus", items: ["Reliable agents need constrained outputs and evaluation loops.", "Retrieval quality matters more than prompt length."] }, { title: "Disagreements", items: ["Sources differ on whether agent autonomy improves production outcomes."] }, { title: "Claims to verify", items: ["Reported 40% productivity gain lacks a linked benchmark.", "Cost comparison uses different context windows."] }, { title: "Missing angles", items: ["Long-term maintenance cost", "Failure recovery in regulated settings"] }],
};

function playlist(id: string, title: string, mode: AgentMode, description: string, videos: Video[]): Playlist {
  const recommended = videos.filter((v) => v.priority === "recommended").map((v) => ({ videoId: v.id, label: "Recommended", reason: v.priorityReason, confidence: "high" as const, evidenceBasis: "Fixture transcript and cross-video comparison" }));
  const lowPriority = videos.filter((v) => v.priority === "low").map((v) => ({ videoId: v.id, label: "Low priority", reason: v.priorityReason, confidence: "medium" as const, evidenceBasis: "High topic overlap in fixture transcripts" }));
  return { id, youtubePlaylistId: `PL_DEMO_${id.toUpperCase()}`, title, description, mode, summaryDepth: "normal", status: "ready", isDemo: true, videos, createdAt: "2026-06-10T09:00:00Z", questions: [], analysis: { mode, overview: mode === "research" ? "The sources converge on constrained, measurable AI workflows. The strongest disagreement is how much autonomy production systems should allow." : mode === "learning" ? "Start with system boundaries and structured outputs, then add retrieval and evaluation before orchestration." : "Three videos offer distinct, practical value. One is mostly repetitive and one needs a transcript before it can be assessed.", recommended, lowPriority, sections: modeSections[mode], warnings: ["Demo analysis uses fixture transcripts and must not be treated as source verification."] } };
}

export const demoPlaylists: Playlist[] = [
  playlist("ai-agents-research", "AI Agents Research", "research", "A cross-source review of production AI agent patterns.", [
    video("demo-r1", "Why Most AI Agents Fail in Production", "Systems Fieldnotes", 0, "Production failures usually come from weak boundaries, missing evaluation, and silent tool errors."),
    video("demo-r2", "Agent Benchmarks: What Actually Transfers", "Applied AI Lab", 1, "Benchmarks are useful only when task distributions match real workflows."),
    video("demo-r3", "RAG vs Long Context for Research", "Model Systems", 2, "Retrieval remains useful for provenance, freshness, and cost control."),
    video("demo-r4", "The Autonomous Company", "Future Stack", 3, "No fixture summary available."),
    video("demo-r5", "Building Reliable Tool-Using Models", "Engineering Signals", 4, "Typed tools, bounded retries, and explicit failure states improve reliability."),
  ]),
  playlist("typescript-path", "Practical TypeScript Path", "learning", "A focused progression from strict types to production patterns.", [
    video("demo-l1", "Strict TypeScript: The Useful Parts", "Type Craft", 0, "Strict mode catches boundary errors and makes refactoring safer."),
    video("demo-l2", "Runtime Validation with Zod", "Type Craft", 1, "Runtime schemas protect untrusted boundaries while preserving inference."),
    video("demo-l3", "Designing Typed API Clients", "Frontend Systems", 2, "API clients should isolate transport, validation, and domain mapping."),
    video("demo-l4", "TypeScript Tips You Already Know", "Code Shorts", 3, "No fixture summary available.", "low"),
  ]),
  playlist("product-inbox", "Product Strategy Inbox", "inbox", "Saved product talks triaged by novelty and actionability.", [
    video("demo-i1", "Strategy Is a Set of Choices", "Product Practice", 0, "Good strategy explicitly names tradeoffs and what will not be pursued."),
    video("demo-i2", "Continuous Discovery in Small Teams", "Build Better", 1, "Small teams can run lightweight discovery with weekly customer touchpoints."),
    video("demo-i3", "The North Star Metric Explained", "Growth Basics", 2, "North-star metrics need input metrics and guardrails to prevent local optimization.", "low"),
    video("demo-i4", "Ten Product Trends", "Weekly Product", 3, "No fixture summary available."),
  ]),
];

export function createDemoPlaylist(mode: AgentMode, title?: string): Playlist {
  const source = demoPlaylists.find((p) => p.mode === mode) ?? demoPlaylists[0];
  return { ...structuredClone(source), id: `${source.id}-${Date.now()}`, title: title?.trim() || source.title, createdAt: new Date().toISOString() };
}
