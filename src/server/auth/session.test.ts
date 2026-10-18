import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Minimal Supabase query builder: records calls and resolves to `result`.
const calls: Array<[string, ...unknown[]]> = [];
let result: { data?: unknown; error: unknown } = { error: null };
const builder = {
  insert: (...args: unknown[]) => record("insert", args),
  select: (...args: unknown[]) => record("select", args),
  delete: (...args: unknown[]) => record("delete", args),
  eq: (...args: unknown[]) => record("eq", args),
  gt: (...args: unknown[]) => record("gt", args),
  maybeSingle: () => Promise.resolve(result),
  // biome-ignore lint/suspicious/noThenProperty: mimics Supabase's awaitable builder
  then: (resolve: (value: unknown) => unknown) => resolve(result),
};
function record(method: string, args: unknown[]) {
  calls.push([method, ...args]);
  return builder;
}
const from = vi.fn(() => builder);
vi.mock("@/server/db", () => ({ getDb: () => ({ from }) }));

const {
  createSession,
  deleteSession,
  generateSessionToken,
  getSessionUser,
  hashSessionToken,
} = await import("./session");

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-17T12:00:00Z");

const account = {
  id: "acc_123",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  active: true,
  created_at: "2026-10-01T12:00:00Z",
};

beforeEach(() => {
  calls.length = 0;
  from.mockClear();
  result = { error: null };
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("generateSessionToken", () => {
  it("returns 43 base64url characters (32 random bytes)", () => {
    expect(generateSessionToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("returns a different token every time", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateSessionToken()),
    );
    expect(tokens.size).toBe(50);
  });
});

describe("hashSessionToken", () => {
  it("is a deterministic SHA-256 hex digest that differs from the token", () => {
    const token = "some-token";
    const expected = createHash("sha256").update(token).digest("hex");
    expect(hashSessionToken(token)).toBe(expected);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).not.toBe(token);
  });
});

describe("createSession", () => {
  it("stores the token hash, never the token, expiring in 7 days", async () => {
    const { token, expiresAt } = await createSession("acc_123");

    expect(from).toHaveBeenCalledWith("sessions");
    const insert = calls.find(([method]) => method === "insert");
    const row = insert?.[1] as Record<string, string>;
    expect(row.account_id).toBe("acc_123");
    expect(row.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(row.token_hash).toBe(hashSessionToken(token));
    expect(Object.values(row)).not.toContain(token);
    expect(expiresAt.getTime()).toBe(NOW.getTime() + 7 * DAY_MS);
    expect(row.created_at).toBe(NOW.toISOString());
    expect(row.expires_at).toBe(expiresAt.toISOString());
  });

  it("throws when the insert fails", async () => {
    result = { error: { message: "boom" } };
    await expect(createSession("acc_123")).rejects.toThrow("boom");
  });
});

describe("getSessionUser", () => {
  it("maps a valid session to the SessionUser", async () => {
    result = {
      data: {
        expires_at: new Date(NOW.getTime() + DAY_MS).toISOString(),
        accounts: account,
      },
      error: null,
    };

    const user = await getSessionUser("plain-token");

    expect(user).toEqual({
      id: "acc_123",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      createdAt: new Date("2026-10-01T12:00:00Z"),
    });
    // One query that looks up by hash and filters expired and inactive rows
    expect(from).toHaveBeenCalledOnce();
    expect(calls).toContainEqual([
      "eq",
      "token_hash",
      hashSessionToken("plain-token"),
    ]);
    expect(calls).toContainEqual(["gt", "expires_at", NOW.toISOString()]);
    expect(calls).toContainEqual(["eq", "accounts.active", true]);
  });

  it("returns null when there is no session", async () => {
    result = { data: null, error: null };
    expect(await getSessionUser("unknown")).toBeNull();
  });

  it("returns null for an expired session", async () => {
    result = {
      data: {
        expires_at: new Date(NOW.getTime() - 1000).toISOString(),
        accounts: account,
      },
      error: null,
    };
    expect(await getSessionUser("plain-token")).toBeNull();
  });

  it("returns null for an inactive account", async () => {
    result = {
      data: {
        expires_at: new Date(NOW.getTime() + DAY_MS).toISOString(),
        accounts: { ...account, active: false },
      },
      error: null,
    };
    expect(await getSessionUser("plain-token")).toBeNull();
  });

  it("returns null when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    result = { data: null, error: { message: "boom" } };
    expect(await getSessionUser("plain-token")).toBeNull();
  });
});

describe("deleteSession", () => {
  it("deletes the row matching the token hash", async () => {
    await deleteSession("plain-token");

    expect(from).toHaveBeenCalledWith("sessions");
    expect(calls).toEqual([
      ["delete"],
      ["eq", "token_hash", hashSessionToken("plain-token")],
    ]);
  });
});
