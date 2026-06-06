import { describe, expect, it } from "vitest";
import { parseFriendlyError } from "@/lib/errors/friendly";

describe("parseFriendlyError", () => {
  it("null/undefined → generic retryable", () => {
    const r = parseFriendlyError(null);
    expect(r.category).toBe("unknown");
    expect(r.retryable).toBe(true);
    expect(r.title).toBe("Ada masalah");
    expect(parseFriendlyError(undefined).category).toBe("unknown");
  });

  it("network error variants", () => {
    expect(parseFriendlyError(new Error("Failed to fetch")).category).toBe(
      "network"
    );
    expect(parseFriendlyError(new Error("ECONNREFUSED")).category).toBe(
      "network"
    );
    expect(parseFriendlyError("network timeout").category).toBe("network");
    expect(parseFriendlyError(new Error("Load failed")).category).toBe(
      "network"
    );
    expect(parseFriendlyError(new Error("Currently offline")).category).toBe(
      "network"
    );
  });

  it("network is retryable", () => {
    expect(
      parseFriendlyError(new Error("network down")).retryable
    ).toBe(true);
  });

  it("auth error not retryable, suggests login", () => {
    const r = parseFriendlyError(new Error("Unauthorized 401"));
    expect(r.category).toBe("auth");
    expect(r.retryable).toBe(false);
    expect(r.body).toContain("login");
  });

  it("session-style auth detected", () => {
    expect(
      parseFriendlyError(new Error("session expired")).category
    ).toBe("auth");
    expect(
      parseFriendlyError(new Error("invalid token")).category
    ).toBe("auth");
  });

  it("permission category", () => {
    expect(
      parseFriendlyError(new Error("Forbidden")).category
    ).toBe("permission");
    expect(parseFriendlyError(new Error("403")).category).toBe("permission");
  });

  it("validation-like (Zod-style issues array)", () => {
    const zodErr = {
      issues: [{ message: "Score wajib angka" }],
      message: "Score wajib angka",
    };
    const r = parseFriendlyError(zodErr);
    expect(r.category).toBe("validation");
    expect(r.retryable).toBe(false);
    expect(r.body).toContain("Score wajib");
  });

  it("string input", () => {
    expect(parseFriendlyError("plain string error").category).toBe(
      "unknown"
    );
    expect(parseFriendlyError("plain string error").body).toContain(
      "plain string"
    );
  });

  it("object with message property", () => {
    const r = parseFriendlyError({ message: "Server error" });
    expect(r.body).toContain("Server error");
  });

  it("number coerces via String()", () => {
    const r = parseFriendlyError(404);
    expect(r.body).toBeTruthy();
  });

  it("network beats auth when both present", () => {
    // 'network' substring wins because checked first
    const r = parseFriendlyError(new Error("network 401 timeout"));
    expect(r.category).toBe("network");
  });

  it("generic when message has nothing recognizable", () => {
    const r = parseFriendlyError(new Error("xyz internal"));
    expect(r.category).toBe("unknown");
  });
});
