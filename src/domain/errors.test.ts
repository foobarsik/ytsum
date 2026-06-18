import { describe, expect, it } from "vitest";
import { mapExternalError } from "./errors";
describe("error mapping", () => { it("maps quota failures", () => expect(mapExternalError(new Error("quota exceeded")).code).toBe("QUOTA_EXCEEDED")); it("does not leak unknown messages", () => expect(mapExternalError(new Error("secret database detail")).message).toBe("Something went wrong. Please try again.")); });
