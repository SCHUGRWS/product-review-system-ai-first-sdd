import { describe, expect, it } from "vitest";
import {
  formatAverage,
  formatCount,
  formatMonthYear,
  formatPrice,
  formatShortDate,
  formatTimeAgo,
} from "./format";

// Intl puts a non-breaking space after "R$"
const nbsp = (text: string) => text.replace(" ", " ");

describe("formatPrice", () => {
  it("formats cents as Brazilian reais, whatever the UI language", () => {
    expect(formatPrice(199994)).toBe(nbsp("R$ 1.999,94"));
    expect(formatPrice(4990)).toBe(nbsp("R$ 49,90"));
    expect(formatPrice(0)).toBe(nbsp("R$ 0,00"));
  });
});

describe("numbers", () => {
  it("groups thousands per language", () => {
    expect(formatCount("en", 1234)).toBe("1,234");
    expect(formatCount("pt-BR", 1234)).toBe("1.234");
    expect(formatCount("pt-BR", 12)).toBe("12");
  });

  it("writes averages with one decimal per language", () => {
    expect(formatAverage("en", 11 / 3)).toBe("3.7");
    expect(formatAverage("en", 5)).toBe("5.0");
    expect(formatAverage("pt-BR", 11 / 3)).toBe("3,7");
  });
});

describe("dates", () => {
  const now = new Date("2026-10-17T12:00:00Z");

  it("formats relative dates", () => {
    expect(formatTimeAgo("en", new Date("2026-10-14T12:00:00Z"), now)).toBe(
      "3 days ago",
    );
    expect(formatTimeAgo("pt-BR", new Date("2026-10-14T12:00:00Z"), now)).toBe(
      "há 3 dias",
    );
  });

  it("formats month and year", () => {
    const date = new Date("2026-10-17T12:00:00Z");
    expect(formatMonthYear("en", date)).toBe("October 2026");
    expect(formatMonthYear("pt-BR", date)).toBe("outubro de 2026");
  });

  it("formats short dates in UTC", () => {
    const date = new Date("2026-10-18T23:30:00Z");
    expect(formatShortDate("en", date)).toBe("Oct 18, 2026");
    expect(formatShortDate("pt-BR", date)).toBe("18 de out. de 2026");
  });
});
