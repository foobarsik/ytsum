import { describe, expect, it } from "vitest";
import { parseYouTubePlaylistUrl } from "./youtube-url";
describe("parseYouTubePlaylistUrl", () => { it("extracts playlist IDs", () => expect(parseYouTubePlaylistUrl("https://www.youtube.com/playlist?list=PL1234567890_demo")).toBe("PL1234567890_demo")); it("rejects non-YouTube hosts", () => expect(() => parseYouTubePlaylistUrl("https://example.com/?list=PL1234567890")).toThrow("YouTube")); it("rejects missing IDs", () => expect(() => parseYouTubePlaylistUrl("https://youtube.com/watch?v=abc")).toThrow("playlist ID")); });
