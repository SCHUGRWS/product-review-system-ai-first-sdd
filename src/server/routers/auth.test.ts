import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The app router pulls in server-only modules; Vitest runs outside React Server
const insert = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
vi.mock("@/server/db", () => ({
  getDb: () => ({ from: () => ({ insert, select }) }),
}));

const createSession = vi.fn();
const deleteSession = vi.fn();
vi.mock("@/server/auth/session", () => ({ createSession, deleteSession }));

// BotID verdict for sign-up; every test is human unless it says otherwise
const checkBotId = vi.fn();
vi.mock("botid/server", () => ({ checkBotId }));

const { createCaller } = await import("./_app");
const { makeContext, testUser } = await import("@/server/test-utils");
const caller = createCaller(makeContext());

const input = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "Ada@Example.com",
  password: "supersecret",
  confirmPassword: "supersecret",
};

describe("auth.signUp", () => {
  beforeEach(() => {
    insert.mockReset();
    checkBotId.mockReset();
    checkBotId.mockResolvedValue({ isBot: false });
    vi.unstubAllEnvs();
  });

  it("stores the account with a hashed password", async () => {
    insert.mockResolvedValue({ error: null });

    const result = await caller.auth.signUp(input);

    expect(insert).toHaveBeenCalledOnce();
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      active: true,
    });
    expect(row.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(row.password).not.toBe(input.password);
    expect(await bcrypt.compare(input.password, row.password)).toBe(true);
    expect(row.password.startsWith(row.salt)).toBe(true);
    expect(row).not.toHaveProperty("confirmPassword");
    expect(result).toEqual({ id: row.id, email: "ada@example.com" });
  });

  it("returns CONFLICT when the email already exists", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "dup" } });

    await expect(caller.auth.signUp(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("returns INTERNAL_SERVER_ERROR on other database failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    insert.mockResolvedValue({ error: { code: "XX000", message: "boom" } });

    await expect(caller.auth.signUp(input)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("rejects invalid input with BAD_REQUEST before touching the database", async () => {
    const error = await caller.auth
      .signUp({ ...input, email: "nope" })
      .catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_REQUEST");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects a sign-up classified as a bot with FORBIDDEN before touching the database", async () => {
    vi.stubEnv("VERCEL", "1");
    checkBotId.mockResolvedValueOnce({ isBot: true });

    const error = await caller.auth.signUp(input).catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("FORBIDDEN");
    expect(insert).not.toHaveBeenCalled();
  });

  it("skips the BotID check outside Vercel", async () => {
    vi.stubEnv("VERCEL", "");
    insert.mockResolvedValue({ error: null });

    await caller.auth.signUp(input);

    expect(checkBotId).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledOnce();
  });
});

describe("auth.signIn", () => {
  // Low cost keeps the tests fast; the router only compares hashes
  const passwordHash = bcrypt.hashSync("supersecret", 4);
  const account = {
    id: "acc_123",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    password: passwordHash,
    active: true,
  };
  const credentials = { email: " Ada@Example.com ", password: "supersecret" };
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  beforeEach(() => {
    vi.restoreAllMocks();
    maybeSingle.mockReset();
    eq.mockClear();
    select.mockClear();
    createSession.mockReset();
    createSession.mockResolvedValue({ token: "plain-token", expiresAt });
  });

  it("returns the user, creates a session and sets the cookie", async () => {
    maybeSingle.mockResolvedValue({ data: account, error: null });
    const ctx = makeContext();

    const result = await createCaller(ctx).auth.signIn(credentials);

    expect(eq).toHaveBeenCalledWith("email", "ada@example.com");
    expect(createSession).toHaveBeenCalledWith("acc_123");
    expect(result).toEqual({
      id: "acc_123",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    });
    expect(result).not.toHaveProperty("password");
    const cookie = ctx.resHeaders.get("Set-Cookie");
    expect(cookie).toMatch(/^prs_session=plain-token;/);
    expect(cookie).toContain("HttpOnly");
  });

  it("rejects a wrong password with UNAUTHORIZED", async () => {
    maybeSingle.mockResolvedValue({ data: account, error: null });

    await expect(
      caller.auth.signIn({ ...credentials, password: "wrong-password" }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects an unknown email the same way and still runs bcrypt", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const compare = vi.spyOn(bcrypt, "compare");

    await expect(caller.auth.signIn(credentials)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
    expect(compare).toHaveBeenCalledOnce();
    expect(compare.mock.calls[0][0]).toBe("supersecret");
    expect(compare.mock.calls[0][1]).toMatch(/^\$2[aby]\$12\$/);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects an inactive account with the same message", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...account, active: false },
      error: null,
    });

    await expect(caller.auth.signIn(credentials)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_SERVER_ERROR when the account lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "boom" },
    });

    await expect(caller.auth.signIn(credentials)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("returns INTERNAL_SERVER_ERROR when the session cannot be created", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({ data: account, error: null });
    createSession.mockRejectedValue(new Error("insert failed"));
    const ctx = makeContext();

    await expect(
      createCaller(ctx).auth.signIn(credentials),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(ctx.resHeaders.get("Set-Cookie")).toBeNull();
  });

  it("rejects invalid input with BAD_REQUEST before touching the database", async () => {
    const error = await caller.auth
      .signIn({ email: "nope", password: "" })
      .catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_REQUEST");
    expect(select).not.toHaveBeenCalled();
  });
});

describe("auth.signOut", () => {
  beforeEach(() => {
    deleteSession.mockReset();
    deleteSession.mockResolvedValue(undefined);
  });

  it("deletes the session and clears the cookie", async () => {
    const ctx = makeContext({ user: testUser, sessionToken: "plain-token" });

    const result = await createCaller(ctx).auth.signOut();

    expect(result).toEqual({ ok: true });
    expect(deleteSession).toHaveBeenCalledWith("plain-token");
    const cookie = ctx.resHeaders.get("Set-Cookie");
    expect(cookie).toMatch(/^prs_session=;/);
    expect(cookie).toContain("Max-Age=0");
  });

  it("succeeds without a session and still clears the cookie", async () => {
    const ctx = makeContext();

    const result = await createCaller(ctx).auth.signOut();

    expect(result).toEqual({ ok: true });
    expect(deleteSession).not.toHaveBeenCalled();
    expect(ctx.resHeaders.get("Set-Cookie")).toContain("Max-Age=0");
  });
});
