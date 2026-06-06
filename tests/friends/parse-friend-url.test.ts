import { describe, expect, it } from "vitest";
import { parseFriendUrl } from "@/components/friends/QRScanModal";

describe("parseFriendUrl", () => {
  const UUID = "abc12345-1234-1234-1234-1234567890ab";

  it("https + carsel.club + /u/{uuid}", () => {
    expect(parseFriendUrl(`https://carsel.club/u/${UUID}`)).toBe(UUID);
  });

  it("http", () => {
    expect(parseFriendUrl(`http://carsel.club/u/${UUID}`)).toBe(UUID);
  });

  it("relative path", () => {
    expect(parseFriendUrl(`/u/${UUID}`)).toBe(UUID);
  });

  it("trailing slash OK", () => {
    expect(parseFriendUrl(`https://carsel.club/u/${UUID}/`)).toBe(UUID);
  });

  it("with query string OK", () => {
    expect(parseFriendUrl(`https://carsel.club/u/${UUID}?ref=qr`)).toBe(UUID);
  });

  it("trims whitespace", () => {
    expect(parseFriendUrl(`  https://carsel.club/u/${UUID}  `)).toBe(UUID);
  });

  it("non-uuid format → null", () => {
    expect(parseFriendUrl("https://carsel.club/u/not-a-uuid")).toBe(null);
  });

  it("non profile path → null", () => {
    expect(parseFriendUrl("https://carsel.club/sessions/something")).toBe(null);
  });

  it("random text → null", () => {
    expect(parseFriendUrl("hello world")).toBe(null);
  });

  it("empty string → null", () => {
    expect(parseFriendUrl("")).toBe(null);
  });
});
