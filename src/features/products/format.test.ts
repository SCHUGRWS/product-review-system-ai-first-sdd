import { describe, expect, it } from "vitest";
import { formatPrice, formatReviewCount } from "./format";

// Intl puts a non-breaking space after "R$"
const nbsp = (text: string) => text.replace(" ", " ");

describe("formatPrice", () => {
  it("formats cents as Brazilian reais", () => {
    expect(formatPrice(199994)).toBe(nbsp("R$ 1.999,94"));
    expect(formatPrice(4990)).toBe(nbsp("R$ 49,90"));
    expect(formatPrice(0)).toBe(nbsp("R$ 0,00"));
  });
});

describe("formatReviewCount", () => {
  it("formats the count in English", () => {
    expect(formatReviewCount(1)).toBe("1 review");
    expect(formatReviewCount(0)).toBe("0 reviews");
    expect(formatReviewCount(2164)).toBe("2,164 reviews");
  });
});
