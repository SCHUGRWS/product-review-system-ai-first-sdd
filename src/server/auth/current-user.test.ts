import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUser } from "@/server/test-utils";

const cookieStore = { get: vi.fn() };
const connection = vi.fn();
const getSessionUser = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("next/server", () => ({ connection }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("./session", () => ({ getSessionUser }));

const { getCurrentUser, requireUser } = await import("./current-user");

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without a session cookie and skips the lookup", async () => {
    cookieStore.get.mockReturnValue(undefined);

    expect(await getCurrentUser()).toBeNull();
    expect(getSessionUser).not.toHaveBeenCalled();
  });

  it("waits for the request before checking the session against the clock", async () => {
    cookieStore.get.mockReturnValue({ value: "token" });
    getSessionUser.mockResolvedValue(testUser);

    expect(await getCurrentUser()).toBe(testUser);
    expect(cookieStore.get).toHaveBeenCalledWith("prs_session");
    expect(getSessionUser).toHaveBeenCalledWith("token");
    expect(connection.mock.invocationCallOrder[0]).toBeLessThan(
      getSessionUser.mock.invocationCallOrder[0],
    );
  });
});

describe("requireUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the signed-in user", async () => {
    cookieStore.get.mockReturnValue({ value: "token" });
    getSessionUser.mockResolvedValue(testUser);

    expect(await requireUser()).toBe(testUser);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to sign-in when the session is invalid", async () => {
    cookieStore.get.mockReturnValue({ value: "expired" });
    getSessionUser.mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT /auth/sign-in");
    expect(redirect).toHaveBeenCalledWith("/auth/sign-in");
  });
});
