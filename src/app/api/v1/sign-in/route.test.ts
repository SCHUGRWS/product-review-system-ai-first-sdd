import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
vi.mock("@/server/db", () => ({
  getDb: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const createSession = vi.fn();
vi.mock("@/server/auth/session", () => ({
  createSession,
  deleteSession: vi.fn(),
  getSessionUser: vi.fn(async () => null),
}));

const { POST } = await import("./route");

const account = {
  id: "acc_123",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  password: bcrypt.hashSync("supersecret", 4),
  active: true,
};

function request(body: string) {
  return new Request("http://localhost/api/v1/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

const valid = JSON.stringify({
  email: "ada@example.com",
  password: "supersecret",
});

describe("POST /api/v1/sign-in", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    maybeSingle.mockReset();
    createSession.mockReset();
    createSession.mockResolvedValue({
      token: "plain-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  });

  it("returns 200 with the user and sets the session cookie", async () => {
    maybeSingle.mockResolvedValue({ data: account, error: null });

    const response = await POST(request(valid));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "acc_123",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    });
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toMatch(/^prs_session=plain-token;/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("returns 400 for a body that is not JSON", async () => {
    const response = await POST(request("{not json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Request body must be valid JSON",
    });
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors for invalid fields", async () => {
    const response = await POST(
      request(JSON.stringify({ email: "nope", password: "" })),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Some fields are invalid");
    expect(body.fields).toEqual({
      email: ["Enter a valid email address"],
      password: ["Password is required"],
    });
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("returns 401 without a cookie for wrong credentials", async () => {
    maybeSingle.mockResolvedValue({ data: account, error: null });

    const response = await POST(
      request(JSON.stringify({ email: "ada@example.com", password: "wrong" })),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid email or password",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns 500 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "boom" },
    });

    const response = await POST(request(valid));

    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
