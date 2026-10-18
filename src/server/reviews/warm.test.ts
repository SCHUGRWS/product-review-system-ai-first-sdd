import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "@/server/products/fake-db";
import type { RefreshOutcome } from "./summary";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => db.client }));

const refreshSummary = vi.hoisted(() =>
  vi.fn<(productId: string, locale: string) => Promise<RefreshOutcome>>(),
);
vi.mock("./summary", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  refreshSummary,
}));

const { warmSummaries } = await import("./warm");

const ranked = (...counts: number[]) => ({
  data: counts.map((count, i) => ({
    product_id: `p${i + 1}`,
    review_count: count,
    average: 4,
  })),
  error: null,
});
const cached = (...rows: [productId: string, reviewCount: number][]) => ({
  data: rows.map(([product_id, review_count]) => ({
    product_id,
    review_count,
  })),
  error: null,
});

beforeEach(() => {
  db.reset();
  refreshSummary.mockReset();
  refreshSummary.mockResolvedValue("generated");
});

describe("warmSummaries", () => {
  it("refreshes only missing or stale summaries of products with 3+ reviews", async () => {
    // p1: cached at 20, now 30 (stale); p2: cached at 10, now 10 (fresh);
    // p3: no summary; p4: 2 reviews (not a candidate)
    db.queue(ranked(30, 10, 3, 2), cached(["p1", 20], ["p2", 10]));

    const result = await warmSummaries({ limit: 50, locale: "en" });

    expect(db.rpc).toHaveBeenCalledWith("most_reviewed_products", {
      max_count: 10_000,
    });
    expect(db.from).toHaveBeenCalledWith("product_feedback_summaries");
    expect(db.builder.eq).toHaveBeenCalledWith("locale", "en");
    expect(db.builder.in).toHaveBeenCalledWith("product_id", [
      "p1",
      "p2",
      "p3",
    ]);
    expect(refreshSummary.mock.calls).toEqual([
      ["p1", "en"],
      ["p3", "en"],
    ]);
    expect(result).toEqual({
      checked: 3,
      generated: 2,
      skipped: 1,
      failed: 0,
      remaining: 0,
      stopped: null,
    });
  });

  it("passes the locale through", async () => {
    db.queue(ranked(5), cached());

    await warmSummaries({ limit: 50, locale: "pt-BR" });

    expect(db.builder.eq).toHaveBeenCalledWith("locale", "pt-BR");
    expect(refreshSummary).toHaveBeenCalledWith("p1", "pt-BR");
  });

  it("stops at the limit and reports what is left", async () => {
    db.queue(ranked(9, 8, 7, 6, 5), cached());

    const result = await warmSummaries({ limit: 2, locale: "en" });

    expect(refreshSummary).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ checked: 5, generated: 2, remaining: 3 });
  });

  it("runs one product at a time", async () => {
    db.queue(ranked(9, 8, 7), cached());
    let running = 0;
    let most = 0;
    refreshSummary.mockImplementation(async () => {
      running++;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running--;
      return "generated";
    });

    await warmSummaries({ limit: 50, locale: "en" });

    expect(most).toBe(1);
  });

  it("stops when the AI breaker trips, counting that product as failed", async () => {
    db.queue(ranked(9, 8, 7, 6), cached());
    refreshSummary
      .mockResolvedValueOnce("generated")
      .mockResolvedValueOnce("tripped");

    const result = await warmSummaries({ limit: 50, locale: "en" });

    expect(refreshSummary).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      checked: 4,
      generated: 1,
      skipped: 0,
      failed: 1,
      remaining: 2,
      stopped: "ai-off",
    });
  });

  it.each([
    "ai-off",
    "no-key",
  ] as const)("stops at once on %s without counting the product", async (outcome) => {
    db.queue(ranked(9, 8), cached());
    refreshSummary.mockResolvedValue(outcome);

    const result = await warmSummaries({ limit: 50, locale: "en" });

    expect(refreshSummary).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      checked: 2,
      generated: 0,
      skipped: 0,
      failed: 0,
      remaining: 2,
      stopped: outcome,
    });
  });

  it("counts failures and keeps going", async () => {
    db.queue(ranked(9, 8, 7), cached());
    refreshSummary
      .mockResolvedValueOnce("failed")
      .mockResolvedValueOnce("fresh")
      .mockResolvedValueOnce("generated");

    const result = await warmSummaries({ limit: 50, locale: "en" });

    expect(result).toMatchObject({
      generated: 1,
      skipped: 1,
      failed: 1,
      remaining: 0,
      stopped: null,
    });
  });

  it("stops starting products after the deadline", async () => {
    db.queue(ranked(9, 8), cached());

    const result = await warmSummaries({
      limit: 50,
      locale: "en",
      deadline: Date.now() - 1,
    });

    expect(refreshSummary).not.toHaveBeenCalled();
    expect(result).toMatchObject({ remaining: 2, stopped: "time" });
  });

  it("does nothing when no product has 3 reviews", async () => {
    db.queue(ranked(2, 1));

    const result = await warmSummaries({ limit: 50, locale: "en" });

    expect(db.from).not.toHaveBeenCalled();
    expect(result).toEqual({
      checked: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
      remaining: 0,
      stopped: null,
    });
  });

  it("throws when the candidates cannot be listed", async () => {
    db.queue({ data: null, error: { message: "down" } });

    await expect(warmSummaries({ limit: 50, locale: "en" })).rejects.toThrow(
      "Failed to list products for the summary warm-up",
    );
  });
});
