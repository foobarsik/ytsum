import { z } from "zod";
import type { WatchlistChannel } from "./types";

const transcriptStatusSchema = z.enum([
  "available",
  "unavailable",
  "processing",
  "failed",
  "manually_added",
]);
const databaseTimestampSchema = z.string().datetime({ offset: true });

export const persistedWatchlistChannelSchema: z.ZodType<WatchlistChannel> = z.object({
  id: z.string().min(1).max(100),
  youtubeChannelId: z.string().min(1).max(100),
  uploadsPlaylistId: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().max(20_000),
  thumbnail: z.string().max(2_000),
  topic: z.string().max(120),
  addedAt: databaseTimestampSchema,
  lastCheckedAt: databaseTimestampSchema.optional(),
  videos: z
    .array(
      z.object({
        youtubeId: z.string().regex(/^[\w-]{11}$/),
        title: z.string().min(1).max(500),
        description: z.string().max(20_000),
        publishedAt: databaseTimestampSchema,
        thumbnail: z.string().max(2_000),
        transcriptStatus: transcriptStatusSchema,
        insight: z
          .custom<
            NonNullable<WatchlistChannel["videos"][number]["insight"]>
          >((value) => Boolean(value) && typeof value === "object" && typeof (value as { overview?: unknown }).overview === "string")
          .optional(),
      }),
    )
    .max(500),
});
