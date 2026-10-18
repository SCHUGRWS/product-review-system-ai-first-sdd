import { describe, expect, it } from "vitest";
import {
  localeHref,
  pathnameLocale,
  productFeedbackHref,
  productReviewsHref,
  switchLocaleHref,
} from "./routes";

describe("localized routes", () => {
  it("prefixes paths with the locale", () => {
    expect(localeHref("en", "/home")).toBe("/en/home");
    expect(localeHref("pt-BR", "/")).toBe("/pt-BR");
    expect(localeHref("pt-BR", "me")).toBe("/pt-BR/me");
    expect(productReviewsHref("pt-BR", "a b")).toBe("/pt-BR/products/a%20b");
    expect(productFeedbackHref("en", "x")).toBe("/en/products/x/feedback");
  });

  it("reads and switches the locale of a pathname", () => {
    expect(pathnameLocale("/pt-BR/home")).toBe("pt-BR");
    expect(pathnameLocale("/home")).toBeNull();
    expect(switchLocaleHref("/en/me", "pt-BR")).toBe("/pt-BR/me");
    expect(switchLocaleHref("/pt-BR", "en")).toBe("/en");
    expect(switchLocaleHref("/home", "en")).toBe("/en/home");
  });
});
