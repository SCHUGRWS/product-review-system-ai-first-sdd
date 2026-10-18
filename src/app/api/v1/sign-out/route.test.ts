import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUser } from "@/server/test-utils";

vi.mock("@/server/db", () => ({ getDb: vi.fn() }));

const deleteSession = vi.fn();
const getSessionUser = vi.fn();
vi.mock("@/server/auth/session", () => ({
  createSession: vi.fn(),
  deleteSession,
  getSessionUser,
}));

const { POST } = await import("./route");

function request(cookie?: string) {
  return new Request("http://localhost/api/v1/sign-out", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });
}

function expectClearedCookie(response: Response) {
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toMatch(/^prs_session=;/);
  expect(cookie).toContain("Max-Age=0");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Path=/");
}

describe("POST /api/v1/sign-out", () => {
  beforeEach(() => {
    deleteSession.mockReset();
    deleteSession.mockResolvedValue(undefined);
    getSessionUser.mockReset();
  });

  it("deletes the session and clears the cookie", async () => {
    getSessionUser.mockResolvedValue(testUser);

    const response = await POST(request("theme=dark; prs_session=tok_123"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(getSessionUser).toHaveBeenCalledWith("tok_123");
    expect(deleteSession).toHaveBeenCalledWith("tok_123");
    expectClearedCookie(response);
  });

  it("succeeds without a session and still clears the cookie", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(deleteSession).not.toHaveBeenCalled();
    expectClearedCookie(response);
  });
});
