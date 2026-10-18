import { describe, expect, it } from "vitest";
import { parseReviewsPage } from "./reviews.schema";
import {
  barPercent,
  formatAverage,
  reviewCountLabel,
  starsLabel,
  summaryFooter,
} from "./reviews.utils";

describe("reviews utils", () => {
  it("formats the average with one decimal", () => {
    expect(formatAverage(11 / 3)).toBe("3.7");
    expect(formatAverage(5)).toBe("5.0");
  });

  it("pluralizes counts", () => {
    expect(reviewCountLabel(0)).toBe("0 reviews");
    expect(reviewCountLabel(1)).toBe("1 review");
    expect(starsLabel(1)).toBe("1 star");
    expect(starsLabel(4)).toBe("4 stars");
  });

  it("writes the summary footer", () => {
    expect(summaryFooter(1, new Date("2026-10-18T23:30:00Z"))).toBe(
      "AI summary of 1 review, updated Oct 18, 2026",
    );
  });

  it("computes bar widths", () => {
    expect(barPercent(1, 3)).toBe(33);
    expect(barPercent(0, 0)).toBe(0);
  });

  it.each([
    [undefined, 1],
    ["2", 2],
    ["0", 1],
    ["-3", 1],
    ["abc", 1],
    [["4", "5"], 4],
    ["99999999", 10_000],
  ])("parses ?page=%s as %i", (value, expected) => {
    expect(parseReviewsPage(value)).toBe(expected);
  });
});
