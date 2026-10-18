import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WarmOptions, WarmResult } from "@/server/reviews/warm";

const warmSummaries = vi.hoisted(() =>
  vi.fn<(options: WarmOptions) => Promise<WarmResult>>(),
);
vi.mock("@/server/reviews/warm", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  warmSummaries,
}));

const { POST } = await import("./route");

const TOKEN = "test-import-token";

function request(
  body?: string,
  authorization: string | null = `Bearer ${TOKEN}`,
) {
  return new Request("http://localhost/api/v1/summaries/warm", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body,
  });
}

const done: WarmResult = {
  checked: 4,
  generated: 2,
  skipped: 1,
  failed: 1,
  remaining: 0,
  stopped: null,
};

describe("POST /api/v1/summaries/warm", () => {
  beforeEach(() => {
    vi.stubEnv("PRODUCTS_IMPORT_TOKEN", TOKEN);
    warmSummaries.mockReset();
    warmSummaries.mockResolvedValue(done);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["no header", null],
    ["a wrong token", "Bearer nope"],
    ["another scheme", `Basic ${TOKEN}`],
  ])("returns 401 with %s and runs nothing", async (_label, header) => {
    const res = await POST(request("{}", header));

    expect(res.status).toBe(401);
    expect(warmSummaries).not.toHaveBeenCalled();
  });

  it("returns 401 when PRODUCTS_IMPORT_TOKEN is not set", async () => {
    vi.stubEnv("PRODUCTS_IMPORT_TOKEN", "");

    const res = await POST(request("{}"));

    expect(res.status).toBe(401);
    expect(warmSummaries).not.toHaveBeenCalled();
  });

  it("uses limit 50 and English without a body, and returns the counts", async () => {
    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(done);
    expect(warmSummaries).toHaveBeenCalledWith({
      limit: 50,
      locale: "en",
      deadline: expect.any(Number),
    });
  });

  it("passes the limit and locale", async () => {
    await POST(request(JSON.stringify({ limit: 200, locale: "pt-BR" })));

    expect(warmSummaries.mock.calls[0][0]).toMatchObject({
      limit: 200,
      locale: "pt-BR",
    });
  });

  it("stops new work before maxDuration", async () => {
    const before = Date.now();
    await POST(request());

    const deadline = warmSummaries.mock.calls[0][0].deadline ?? 0;
    expect(deadline - before).toBeGreaterThan(0);
    expect(deadline - before).toBeLessThanOrEqual(300_000 - 30_000);
  });

  it.each([
    ["a limit over 200", { limit: 201 }],
    ["a limit of 0", { limit: 0 }],
    ["a fractional limit", { limit: 1.5 }],
    ["an unknown locale", { locale: "fr" }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await POST(request(JSON.stringify(body)));

    expect(res.status).toBe(400);
    expect(warmSummaries).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that is not JSON", async () => {
    const res = await POST(request("{nope"));

    expect(res.status).toBe(400);
  });

  it("returns 500 and logs when the run fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    warmSummaries.mockRejectedValue(new Error("db down"));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(log).toHaveBeenCalled();
  });
});
