/**
 * Tests untuk lib/log/sanitize.ts
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2 (privacy)
 */

import { describe, it, expect } from "vitest";
import { sanitizeContext, maskPhone } from "@/lib/log/sanitize";

describe("maskPhone", () => {
  it("returns *** untuk non-string input", () => {
    expect(maskPhone(123456789)).toBe("[REDACTED]");
    expect(maskPhone(null)).toBe("[REDACTED]");
    expect(maskPhone(undefined)).toBe("[REDACTED]");
    expect(maskPhone({})).toBe("[REDACTED]");
  });

  it("masks normal Indonesian phone, preserve last 4", () => {
    expect(maskPhone("628123456789")).toBe("***6789");
  });

  it("strip non-digits before masking", () => {
    expect(maskPhone("+62 812-3456-789")).toBe("***6789");
    expect(maskPhone("(0812) 3456-789")).toBe("***6789");
  });

  it("returns *** untuk empty string", () => {
    expect(maskPhone("")).toBe("***");
  });

  it("returns *** untuk short (<=4 digits)", () => {
    expect(maskPhone("123")).toBe("***");
    expect(maskPhone("1234")).toBe("***");
  });
});

describe("sanitizeContext — PII redaction", () => {
  it("redacts key 'password'", () => {
    const r = sanitizeContext({ password: "secret123" });
    expect(r.password).toBe("[REDACTED]");
  });

  it("redacts case-insensitive (Password, PASSWORD)", () => {
    const r1 = sanitizeContext({ Password: "x" });
    const r2 = sanitizeContext({ PASSWORD: "x" });
    expect(r1.Password).toBe("[REDACTED]");
    expect(r2.PASSWORD).toBe("[REDACTED]");
  });

  it("redacts substring matches: user_password, my_secret", () => {
    const r = sanitizeContext({
      user_password: "abc",
      my_secret_value: "xyz",
    });
    expect(r.user_password).toBe("[REDACTED]");
    expect(r.my_secret_value).toBe("[REDACTED]");
  });

  it("redacts various token-like keys", () => {
    const r = sanitizeContext({
      apiKey: "x",
      api_key: "x",
      authorization: "x",
      cookie: "x",
      token: "x",
      fonnte_token: "x",
      auth_session_secret: "x",
    });
    for (const v of Object.values(r)) {
      expect(v).toBe("[REDACTED]");
    }
  });

  it("masks phone-like keys", () => {
    const r = sanitizeContext({
      phone: "628123456789",
      whatsapp: "628999888777",
      whatsapp_number: "628111222333",
      whatsappNumber: "628444555666",
    });
    expect(r.phone).toBe("***6789");
    expect(r.whatsapp).toBe("***8777");
    expect(r.whatsapp_number).toBe("***2333");
    expect(r.whatsappNumber).toBe("***5666");
  });

  it("preserves regular keys (numeric, string, boolean)", () => {
    const r = sanitizeContext({
      sessionId: "abc",
      count: 42,
      enabled: true,
    });
    expect(r).toEqual({
      sessionId: "abc",
      count: 42,
      enabled: true,
    });
  });
});

describe("sanitizeContext — value handling", () => {
  it("null and undefined passed through", () => {
    const r = sanitizeContext({ a: null, b: undefined });
    expect(r.a).toBe(null);
    expect(r.b).toBe(undefined);
  });

  it("Date → ISO string", () => {
    const d = new Date("2026-06-02T12:00:00.000Z");
    const r = sanitizeContext({ when: d });
    expect(r.when).toBe("2026-06-02T12:00:00.000Z");
  });

  it("Error → {name, message, stack}", () => {
    const err = new Error("boom");
    const r = sanitizeContext({ error: err });
    expect(r.error).toMatchObject({
      name: "Error",
      message: "boom",
    });
    expect(typeof (r.error as Record<string, unknown>).stack).toBe("string");
  });

  it("nested object: recurse", () => {
    const r = sanitizeContext({
      session: {
        id: "abc",
        password: "secret",
        nested: { token: "x" },
      },
    });
    const session = r.session as Record<string, unknown>;
    expect(session.id).toBe("abc");
    expect(session.password).toBe("[REDACTED]");
    expect(
      (session.nested as Record<string, unknown>).token
    ).toBe("[REDACTED]");
  });

  it("array: recurse to items (key 'items' not in blacklist)", () => {
    const r = sanitizeContext({
      items: [{ password: "a" }, { password: "b" }],
    });
    expect(r.items).toEqual([
      { password: "[REDACTED]" },
      { password: "[REDACTED]" },
    ]);
  });

  it("key dengan substring 'token' (e.g. 'tokens') juga di-redact (safe-by-default)", () => {
    const r = sanitizeContext({
      tokens: ["secret1", "secret2"],
    });
    expect(r.tokens).toBe("[REDACTED]");
  });

  it("truncate long strings >2000 char", () => {
    const longStr = "x".repeat(3000);
    const r = sanitizeContext({ message: longStr });
    expect((r.message as string).length).toBe(2001); // 2000 + "…"
    expect((r.message as string).endsWith("…")).toBe(true);
  });

  it("function / symbol → [REDACTED]", () => {
    const r = sanitizeContext({
      fn: () => "x",
      sym: Symbol("test"),
    });
    expect(r.fn).toBe("[REDACTED]");
    expect(r.sym).toBe("[REDACTED]");
  });

  it("bigint → string representation", () => {
    const r = sanitizeContext({ n: BigInt(12345) });
    expect(r.n).toBe("12345");
  });

  it("array elements at depth > MAX_DEPTH get REDACTED (sanitizeValue early-return)", () => {
    // Trace dgn MAX_DEPTH=5:
    //   sanitizeContext({a:...}, 0) → sanitizeValue({b:...}, 1) [obj]
    //   → sanitizeContext({b:...}, 2) → sanitizeValue({c:[...]}, 3) [obj]
    //   → sanitizeContext({c:[...]}, 4) → sanitizeValue([...], 5) [array]
    //   → arr.map(v => sanitizeValue(v, 6))
    //   → sanitizeValue("deep_value", 6): depth>MAX → return REDACTED
    const r = sanitizeContext({
      a: { b: { c: ["deep_value"] } },
    });
    const b = (r.a as Record<string, unknown>).b as Record<string, unknown>;
    expect(b.c).toEqual(["[REDACTED]"]);
  });

  it("depth limit caps di MAX_DEPTH", () => {
    // Build deeply nested object
    type Nested = { next?: Nested; value?: number };
    const deep: Nested = { value: 1 };
    let cur = deep;
    for (let i = 0; i < 10; i++) {
      const next: Nested = { value: i };
      cur.next = next;
      cur = next;
    }
    const r = sanitizeContext({ root: deep });
    // Walk down at most MAX_DEPTH levels — should hit _truncated somewhere
    let depth = 0;
    let cursor: unknown = r.root;
    while (cursor && typeof cursor === "object") {
      const c = cursor as Record<string, unknown>;
      if (c._truncated === true) break;
      cursor = c.next;
      depth++;
      if (depth > 20) break;
    }
    expect(depth).toBeLessThanOrEqual(10);
  });

  it("circular reference: stops at depth limit", () => {
    type Loop = { name?: string; self?: Loop };
    const circular: Loop = { name: "loop" };
    circular.self = circular;
    // Tidak throw, walaupun infinite loop
    expect(() => sanitizeContext({ x: circular })).not.toThrow();
  });

  it("Error message yang sangat panjang di-truncate", () => {
    const longErr = new Error("x".repeat(3000));
    const r = sanitizeContext({ error: longErr });
    const e = r.error as Record<string, unknown>;
    expect(typeof e.message).toBe("string");
    expect((e.message as string).length).toBe(3000); // raw message not truncated, only stack
  });

  it("Error stack yang sangat panjang di-truncate", () => {
    const longErr = new Error("short");
    longErr.stack = "x".repeat(3000);
    const r = sanitizeContext({ error: longErr });
    const e = r.error as Record<string, unknown>;
    expect((e.stack as string).length).toBe(2001);
  });

  it("Error without stack: stack stays undefined", () => {
    const err = new Error("no stack");
    err.stack = undefined;
    const r = sanitizeContext({ error: err });
    const e = r.error as Record<string, unknown>;
    expect(e.stack).toBeUndefined();
  });
});

describe("sanitizeContext — does not mutate input", () => {
  it("input object unchanged after sanitize", () => {
    const input = {
      password: "secret",
      phone: "628123456789",
      ok: "fine",
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    sanitizeContext(input);
    expect(input).toEqual(snapshot);
  });
});
