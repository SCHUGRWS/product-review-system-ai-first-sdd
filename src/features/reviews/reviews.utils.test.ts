import { describe, expect, it } from "vitest";
import { createT } from "@/i18n/t";
import { parseReviewsPage } from "./reviews.schema";
import {
  barPercent,
  reviewCountLabel,
  starsLabel,
  summaryFooter,
} from "./reviews.utils";

const t = createT("en");
const pt = createT("pt-BR");

describe("reviews utils", () => {
  it("pluralizes counts", () => {
    expect(reviewCountLabel(t, "en", 0)).toBe("0 reviews");
    expect(reviewCountLabel(t, "en", 1)).toBe("1 review");
    expect(reviewCountLabel(t, "en", 2164)).toBe("2,164 reviews");
    expect(reviewCountLabel(pt, "pt-BR", 2164)).toBe("2.164 avaliações");
    expect(starsLabel(t, 1)).toBe("1 star");
    expect(starsLabel(t, 4)).toBe("4 stars");
    expect(starsLabel(pt, 4)).toBe("4 estrelas");
  });

  it("writes the summary footer", () => {
    expect(summaryFooter(t, "en", 1, new Date("2026-10-18T23:30:00Z"))).toBe(
      "AI summary of 1 review, updated Oct 18, 2026",
    );
    expect(
      summaryFooter(pt, "pt-BR", 3, new Date("2026-10-18T23:30:00Z")),
    ).toBe("Resumo de IA de 3 avaliações, atualizado em 18 de out. de 2026");
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
