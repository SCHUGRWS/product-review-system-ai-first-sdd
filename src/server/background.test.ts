import { beforeEach, describe, expect, it, vi } from "vitest";

// next/server's after() needs a Next.js request; the callback is captured
const after = vi.hoisted(() => vi.fn<(task: () => Promise<void>) => void>());
vi.mock("next/server", () => ({ after }));

const { runInBackground } = await import("./background");

beforeEach(() => {
  after.mockReset();
  vi.restoreAllMocks();
});

describe("runInBackground", () => {
  it("hands the task to after() without running it now", async () => {
    const task = vi.fn(async () => "done");

    runInBackground("job", task);

    expect(after).toHaveBeenCalledTimes(1);
    expect(task).not.toHaveBeenCalled();
    await after.mock.calls[0][0]();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("logs a failing task instead of throwing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");

    runInBackground("summary refresh", async () => {
      throw error;
    });

    await expect(after.mock.calls[0][0]()).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      "[background] summary refresh failed",
      error,
    );
  });
});
