import { describe, expect, it } from "vitest";
import { createT } from "@/i18n/t";
import { postedAgo, shortTitle } from "./feedback.utils";

const t = createT("en");

describe("postedAgo", () => {
  const now = new Date("2026-10-17T12:00:00Z");

  it("says just now for less than a minute", () => {
    expect(postedAgo(t, "en", new Date("2026-10-17T11:59:30Z"), now)).toBe(
      "Posted just now",
    );
  });

  it("formats older dates relative to now", () => {
    expect(postedAgo(t, "en", new Date("2026-10-17T09:00:00Z"), now)).toBe(
      "Posted 3 hours ago",
    );
    expect(postedAgo(t, "en", new Date("2026-10-14T12:00:00Z"), now)).toBe(
      "Posted 3 days ago",
    );
  });
});

describe("postedAgo in Portuguese", () => {
  it("uses Brazilian Portuguese words", () => {
    const pt = createT("pt-BR");
    const now = new Date("2026-10-17T12:00:00Z");
    expect(postedAgo(pt, "pt-BR", new Date("2026-10-17T11:59:30Z"), now)).toBe(
      "Publicada agora mesmo",
    );
    expect(postedAgo(pt, "pt-BR", new Date("2026-10-14T12:00:00Z"), now)).toBe(
      "Publicada há 3 dias",
    );
  });
});

describe("shortTitle", () => {
  it("keeps short titles as they are, with collapsed spaces", () => {
    expect(shortTitle("  Air Fryer   Mondial 5L ")).toBe(
      "Air Fryer Mondial 5L",
    );
  });

  it("cuts long titles at a word boundary with an ellipsis", () => {
    const title =
      "Smart TV Samsung 50 polegadas Crystal UHD 4K, com Alexa integrada, Gaming Hub e Tizen";
    const short = shortTitle(title, 40);
    expect(short).toBe("Smart TV Samsung 50 polegadas Crystal…");
    expect(short.length).toBeLessThanOrEqual(40);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(
      shortTitle("Chaleira Elétrica Inox, 1,7L com desligamento", 24),
    ).toBe("Chaleira Elétrica Inox…");
  });

  it("cuts inside a very long word when there is no good boundary", () => {
    expect(shortTitle("a".repeat(30), 10)).toBe(`${"a".repeat(9)}…`);
  });
});
