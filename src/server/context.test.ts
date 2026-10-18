import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUser } from "@/server/test-utils";

const getSessionUser = vi.fn();
vi.mock("@/server/auth/session", () => ({ getSessionUser }));

const { createContext } = await import("./context");

function request(cookie?: string) {
  return new Request("http://localhost/api/trpc", {
    headers: cookie ? { cookie } : {},
  });
}

describe("createContext", () => {
  beforeEach(() => {
    getSessionUser.mockReset();
  });

  it("resolves the user from the session cookie", async () => {
    getSessionUser.mockResolvedValue(testUser);
    const resHeaders = new Headers();

    const ctx = await createContext({
      req: request("theme=dark; prs_session=abc"),
      resHeaders,
    });

    expect(getSessionUser).toHaveBeenCalledWith("abc");
    expect(ctx).toEqual({ user: testUser, sessionToken: "abc", resHeaders });
  });

  it("keeps the token of an invalid session so sign-out can delete it", async () => {
    getSessionUser.mockResolvedValue(null);

    const ctx = await createContext({
      req: request("prs_session=expired"),
      resHeaders: new Headers(),
    });

    expect(ctx.user).toBeNull();
    expect(ctx.sessionToken).toBe("expired");
  });

  it("has no user and no token without the cookie", async () => {
    const ctx = await createContext({
      req: request(),
      resHeaders: new Headers(),
    });

    expect(getSessionUser).not.toHaveBeenCalled();
    expect(ctx.user).toBeNull();
    expect(ctx.sessionToken).toBeNull();
  });
});
