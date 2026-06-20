export type ErrorCode =
  | "INVALID_PLAYLIST_URL"
  | "PRIVATE_PLAYLIST"
  | "QUOTA_EXCEEDED"
  | "EMPTY_PLAYLIST"
  | "DUPLICATE_PLAYLIST"
  | "TRANSCRIPT_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "INVALID_AI_OUTPUT"
  | "OFFLINE"
  | "UNKNOWN";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function mapExternalError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("quota"))
    return new AppError(
      "QUOTA_EXCEEDED",
      "YouTube's daily request limit has been reached. Try again later.",
      true,
    );
  if (message.includes("private") || message.includes("forbidden"))
    return new AppError("PRIVATE_PLAYLIST", "This playlist is private or cannot be accessed.");
  if (message.includes("timeout"))
    return new AppError(
      "AI_TIMEOUT",
      "The AI provider took too long to respond. Your progress was saved.",
      true,
    );
  if (message.includes("provider returned error") || message.includes("invalid_argument"))
    return new AppError(
      "INVALID_AI_OUTPUT",
      "The selected AI model rejected the requested output format.",
      true,
    );
  return new AppError("UNKNOWN", "Something went wrong. Please try again.", true);
}
