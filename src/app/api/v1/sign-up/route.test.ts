import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
vi.mock("@/server/db", () => ({
  getDb: () => ({ from: () => ({ insert }) }),
}));

vi.mock("@/server/auth/session", () => ({
  getSessionUser: vi.fn(async () => null),
}));

const { POST } = await import("./route");

function request(body: string) {
  return new Request("http://localhost/api/v1/sign-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

const valid = JSON.stringify({
  firstName: "Ada",
  lastName: "Lovelace",
  email: "Ada@Example.com",
  password: "supersecret",
  confirmPassword: "supersecret",
});

describe("POST /api/v1/sign-up", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    insert.mockReset();
  });

  it("returns 201 with the new account id and email", async () => {
    insert.mockResolvedValue({ error: null });

    const response = await POST(request(valid));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ id: expect.any(String), email: "ada@example.com" });
    expect(body.id).toBe(insert.mock.calls[0][0].id);
  });

  it("returns 400 for a body that is not JSON", async () => {
    const response = await POST(request("{not json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Request body must be valid JSON",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors for invalid fields", async () => {
    const response = await POST(
      request(JSON.stringify({ ...JSON.parse(valid), email: "nope" })),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Some fields are invalid");
    expect(body.fields).toEqual({ email: ["Enter a valid email address"] });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns 409 when the email is already registered", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "dup" } });

    const response = await POST(request(valid));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This email is already registered",
    });
  });

  it("returns 500 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    insert.mockResolvedValue({ error: { code: "XX000", message: "boom" } });

    const response = await POST(request(valid));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Could not create the account. Please try again later.",
    });
  });
});
