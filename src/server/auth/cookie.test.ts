import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readSessionToken,
  serializeClearedSessionCookie,
  serializeSessionCookie,
} from "./cookie";
import { SESSION_TTL_SECONDS } from "./types";

const NOW = new Date("2026-10-17T12:00:00Z");

function attributes(cookie: string) {
  return cookie.split("; ").slice(1);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("serializeSessionCookie", () => {
  it("sets the session token with HttpOnly, SameSite=Lax, Path=/ and 7 days", () => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    const expiresAt = new Date(NOW.getTime() + SESSION_TTL_SECONDS * 1000);

    const cookie = serializeSessionCookie("abc_DEF-123", expiresAt);

    expect(cookie.startsWith("prs_session=abc_DEF-123; ")).toBe(true);
    expect(attributes(cookie)).toEqual(
      expect.arrayContaining([
        "HttpOnly",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=604800",
        `Expires=${expiresAt.toUTCString()}`,
      ]),
    );
  });

  it("adds Secure only in production", () => {
    const expiresAt = new Date(Date.now() + 1000);
    vi.stubEnv("NODE_ENV", "development");
    expect(attributes(serializeSessionCookie("t", expiresAt))).not.toContain(
      "Secure",
    );
    vi.stubEnv("NODE_ENV", "production");
    expect(attributes(serializeSessionCookie("t", expiresAt))).toContain(
      "Secure",
    );
  });
});

describe("serializeClearedSessionCookie", () => {
  it("empties the cookie with Max-Age=0 and the same attributes", () => {
    const cookie = serializeClearedSessionCookie();

    expect(cookie.startsWith("prs_session=; ")).toBe(true);
    expect(attributes(cookie)).toEqual(
      expect.arrayContaining([
        "Max-Age=0",
        "HttpOnly",
        "SameSite=Lax",
        "Path=/",
      ]),
    );
  });
});

describe("readSessionToken", () => {
  it("reads the token from a header with several cookies", () => {
    expect(readSessionToken("theme=dark; prs_session=tok_123; other=1")).toBe(
      "tok_123",
    );
    expect(readSessionToken("prs_session=tok_123")).toBe("tok_123");
  });

  it("does not match cookies whose name only contains the session name", () => {
    expect(readSessionToken("old_prs_session=nope; x=1")).toBeNull();
  });

  it("returns null when the cookie is absent or empty", () => {
    expect(readSessionToken(null)).toBeNull();
    expect(readSessionToken("")).toBeNull();
    expect(readSessionToken("theme=dark")).toBeNull();
    expect(readSessionToken("prs_session=")).toBeNull();
  });
});
