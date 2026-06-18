import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { decode } from "npm:html-entities@2.6.0";
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
} from "npm:youtube-transcript-plus@2.0.0";

const videoIdPattern = /^[\w-]{11}$/;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const handler = {
  fetch: withSupabase({ auth: "none" }, async (request) => {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const expectedSecret = Deno.env.get("TRANSCRIPT_FUNCTION_SECRET");
    if (!expectedSecret || request.headers.get("x-transcript-secret") !== expectedSecret) {
      return json({ error: "Unauthorized" }, 401);
    }

    let input: { videoId?: unknown; language?: unknown };
    try {
      input = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (typeof input.videoId !== "string" || !videoIdPattern.test(input.videoId)) {
      return json({ error: "Invalid YouTube video ID" }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const segments = await fetchTranscript(input.videoId, {
        ...(typeof input.language === "string" && input.language ? { lang: input.language } : {}),
        retries: 1,
        retryDelay: 500,
        signal: controller.signal,
      });
      const transcript = segments
        .map((segment) => decode(segment.text).replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");
      return transcript ? json({ status: "available", transcript }) : json({ status: "unavailable" });
    } catch (error) {
      if (
        error instanceof YoutubeTranscriptDisabledError ||
        error instanceof YoutubeTranscriptNotAvailableLanguageError ||
        error instanceof YoutubeTranscriptVideoUnavailableError
      ) return json({ status: "unavailable" });

      console.warn("youtube_transcript_failed", {
        videoId: input.videoId,
        error: error instanceof Error ? error.name : "unknown",
      });
      return json({ status: "failed" });
    } finally {
      clearTimeout(timeout);
    }
  }),
};

export default handler;
