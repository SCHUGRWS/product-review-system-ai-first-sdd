import { describe, expect, it } from "vitest";
import { hasLocale, localeFromAcceptLanguage, pickLocale } from "./locales";

describe("pickLocale", () => {
  it("prefers the prs_locale cookie", () => {
    expect(pickLocale("pt-BR", "en-US,en;q=0.9")).toBe("pt-BR");
    expect(pickLocale("en", "pt-BR,pt;q=0.9")).toBe("en");
  });

  it("ignores an unsupported cookie value", () => {
    expect(pickLocale("fr", "pt-BR")).toBe("pt-BR");
    expect(pickLocale("", null)).toBe("en");
  });

  it.each([
    ["pt-BR,pt;q=0.9", "pt-BR"],
    ["pt-PT", "pt-BR"],
    ["pt", "pt-BR"],
    ["en-US,en;q=0.9", "en"],
    ["fr-FR,fr;q=0.9,pt;q=0.8", "pt-BR"],
    ["fr-FR,en;q=0.5,pt-BR;q=0.8", "pt-BR"],
    ["fr", "en"],
    ["*", "en"],
    ["%%garbage;;q=x", "en"],
    ["pt;q=0,en;q=0.1", "en"],
    [null, "en"],
    [undefined, "en"],
  ])("Accept-Language %j -> %s", (header, expected) => {
    expect(pickLocale(undefined, header)).toBe(expected);
  });

  it("reports when the browser asks for no supported language", () => {
    expect(localeFromAcceptLanguage("de-DE,fr;q=0.8")).toBeNull();
  });
});

describe("hasLocale", () => {
  it("accepts only the shipped locales, case-sensitively", () => {
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("pt-BR")).toBe(true);
    expect(hasLocale("pt-br")).toBe(false);
    expect(hasLocale("pt")).toBe(false);
    expect(hasLocale(undefined)).toBe(false);
  });
});
