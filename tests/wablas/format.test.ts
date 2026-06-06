import { describe, expect, it } from "vitest";
import {
  normalizeWablasPhone,
  buildWablasPayload,
  parseWablasResponse,
} from "@/lib/wablas/format";

describe("normalizeWablasPhone", () => {
  it("non-string input → empty", () => {
    expect(normalizeWablasPhone(undefined)).toBe("");
    expect(normalizeWablasPhone(null)).toBe("");
    expect(normalizeWablasPhone(123)).toBe("");
    expect(normalizeWablasPhone({})).toBe("");
  });

  it("empty/whitespace → empty", () => {
    expect(normalizeWablasPhone("")).toBe("");
    expect(normalizeWablasPhone("   ")).toBe("");
  });

  it("already 62-prefixed → unchanged", () => {
    expect(normalizeWablasPhone("628123456789")).toBe("628123456789");
  });

  it("0-prefixed → 62 replaces 0", () => {
    expect(normalizeWablasPhone("08123456789")).toBe("628123456789");
  });

  it("+62-prefixed → strips +", () => {
    expect(normalizeWablasPhone("+628123456789")).toBe("628123456789");
  });

  it("8-prefixed (no 0/62) → 62 prepended", () => {
    expect(normalizeWablasPhone("8123456789")).toBe("628123456789");
  });

  it("strips spaces", () => {
    expect(normalizeWablasPhone("0812 3456 789")).toBe("62812345678" + "9");
  });

  it("strips dashes + dots + parens", () => {
    expect(normalizeWablasPhone("0812-3456.789")).toBe("628123456789");
    expect(normalizeWablasPhone("(0812)3456789")).toBe("628123456789");
  });

  it("trim leading/trailing whitespace", () => {
    expect(normalizeWablasPhone("  +628123456789  ")).toBe("628123456789");
  });

  it("garbage only → empty after digit strip", () => {
    expect(normalizeWablasPhone("abcdef")).toBe("");
    expect(normalizeWablasPhone("---")).toBe("");
  });

  it("unknown prefix (not 0/62/8) → pass-through digits", () => {
    // e.g., international Malaysia "60123" — fallback unchanged
    expect(normalizeWablasPhone("60123456789")).toBe("60123456789");
  });
});

describe("buildWablasPayload", () => {
  it("basic message", () => {
    const payload = buildWablasPayload("08123456789", "Hello world");
    const parsed = new URLSearchParams(payload);
    expect(parsed.get("phone")).toBe("628123456789");
    expect(parsed.get("message")).toBe("Hello world");
  });

  it("encodes special characters in message", () => {
    const payload = buildWablasPayload(
      "628123",
      "Kode: *123* & link: https://x.com/?a=1"
    );
    const parsed = new URLSearchParams(payload);
    expect(parsed.get("message")).toBe(
      "Kode: *123* & link: https://x.com/?a=1"
    );
  });

  it("empty message still has phone field", () => {
    const payload = buildWablasPayload("628123", "");
    const parsed = new URLSearchParams(payload);
    expect(parsed.get("phone")).toBe("628123");
    expect(parsed.get("message")).toBe("");
  });

  it("normalizes phone in payload", () => {
    const payload = buildWablasPayload("+628123456789", "x");
    const parsed = new URLSearchParams(payload);
    expect(parsed.get("phone")).toBe("628123456789");
  });

  it("preserves newlines in message", () => {
    const payload = buildWablasPayload("628123", "line1\nline2\nline3");
    const parsed = new URLSearchParams(payload);
    expect(parsed.get("message")).toBe("line1\nline2\nline3");
  });
});

describe("parseWablasResponse", () => {
  it("null/undefined → invalid", () => {
    expect(parseWablasResponse(null)).toEqual({
      status: false,
      message: "invalid response",
      data: null,
    });
    expect(parseWablasResponse(undefined)).toEqual({
      status: false,
      message: "invalid response",
      data: null,
    });
  });

  it("non-object → invalid", () => {
    expect(parseWablasResponse("string")).toMatchObject({ status: false });
    expect(parseWablasResponse(123)).toMatchObject({ status: false });
  });

  it("success boolean status", () => {
    const r = parseWablasResponse({
      status: true,
      message: "Pesan terkirim",
      data: { id: "abc" },
    });
    expect(r.status).toBe(true);
    expect(r.message).toBe("Pesan terkirim");
    expect(r.data).toEqual({ id: "abc" });
  });

  it("status as string 'true' → coerced to boolean true", () => {
    const r = parseWablasResponse({ status: "true", message: "ok" });
    expect(r.status).toBe(true);
  });

  it("status as string 'false' → false (not coerced)", () => {
    const r = parseWablasResponse({ status: "false", message: "err" });
    expect(r.status).toBe(false);
  });

  it("error response with reason fallback", () => {
    const r = parseWablasResponse({
      status: false,
      reason: "device not connected",
    });
    expect(r.status).toBe(false);
    expect(r.message).toBe("device not connected");
  });

  it("message wins over reason when both present", () => {
    const r = parseWablasResponse({
      status: false,
      message: "primary",
      reason: "secondary",
    });
    expect(r.message).toBe("primary");
  });

  it("empty message string falls back to reason", () => {
    const r = parseWablasResponse({
      status: false,
      message: "",
      reason: "device offline",
    });
    expect(r.message).toBe("device offline");
  });

  it("missing message + reason → null", () => {
    const r = parseWablasResponse({ status: false });
    expect(r.message).toBeNull();
  });

  it("missing data → null", () => {
    const r = parseWablasResponse({ status: true });
    expect(r.data).toBeNull();
  });

  it("non-string message ignored", () => {
    const r = parseWablasResponse({ status: false, message: 42 });
    expect(r.message).toBeNull();
  });
});
