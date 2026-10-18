import { beforeEach, describe, expect, it, vi } from "vitest";

const eq = vi.fn();
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));
vi.mock("@/server/db", () => ({ getDb: () => ({ from }) }));

const { createCaller } = await import("./_app");
const { makeContext, testUser } = await import("@/server/test-utils");

describe("account.setLocale", () => {
  beforeEach(() => {
    eq.mockReset().mockResolvedValue({ error: null });
    update.mockClear();
    from.mockClear();
  });

  it("saves the locale on the account and sets the prs_locale cookie", async () => {
    const ctx = makeContext({ user: testUser });

    const result = await createCaller(ctx).account.setLocale({
      locale: "pt-BR",
    });

    expect(result).toEqual({ locale: "pt-BR" });
    expect(from).toHaveBeenCalledWith("accounts");
    expect(update).toHaveBeenCalledWith({ locale: "pt-BR" });
    expect(eq).toHaveBeenCalledWith("id", testUser.id);
    const cookie = ctx.resHeaders.get("Set-Cookie");
    expect(cookie).toMatch(/^prs_locale=pt-BR;/);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=31536000");
  });

  it("rejects an unsupported locale before touching the database", async () => {
    const caller = createCaller(makeContext({ user: testUser }));
    await expect(
      caller.account.setLocale({ locale: "fr" as never }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(update).not.toHaveBeenCalled();
  });

  it("is UNAUTHORIZED without a signed-in user", async () => {
    const ctx = makeContext();
    await expect(
      createCaller(ctx).account.setLocale({ locale: "en" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(update).not.toHaveBeenCalled();
    expect(ctx.resHeaders.get("Set-Cookie")).toBeNull();
  });

  it("does not set the cookie when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    eq.mockResolvedValue({ error: { message: "db down" } });
    const ctx = makeContext({ user: testUser });

    await expect(
      createCaller(ctx).account.setLocale({ locale: "en" }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(ctx.resHeaders.get("Set-Cookie")).toBeNull();
  });
});
