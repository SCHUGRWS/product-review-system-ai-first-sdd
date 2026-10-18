import { describe, expect, it, vi } from "vitest";

vi.mock("./dictionaries/en", () => ({
  en: {
    "test.plain": "Hello",
    "test.vars": "Summary of {count} reviews by {name}",
  },
}));

const { t } = await import("./t");

describe("t", () => {
  it("returns the English text", () => {
    expect(t("test.plain" as never)).toBe("Hello");
  });

  it("fills placeholders and keeps unknown ones", () => {
    expect(t("test.vars" as never, { count: 3 })).toBe(
      "Summary of 3 reviews by {name}",
    );
  });
});
