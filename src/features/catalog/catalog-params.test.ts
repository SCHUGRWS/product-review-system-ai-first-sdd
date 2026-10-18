import { describe, expect, it } from "vitest";
import {
  catalogHref,
  isValidSlug,
  MAX_QUERY_LENGTH,
  parseCatalogParams,
} from "./catalog-params";

describe("parseCatalogParams", () => {
  it("shows the lists without params", () => {
    expect(parseCatalogParams({})).toEqual({
      view: "lists",
      q: "",
      category: null,
      page: 1,
      focusSearch: false,
      hint: null,
    });
  });

  it("trims and collapses the search text", () => {
    const params = parseCatalogParams({ q: "  smart   tv " });
    expect(params.view).toBe("search");
    expect(params.q).toBe("smart tv");
  });

  it("falls back to the lists with a hint when q is shorter than 2", () => {
    expect(parseCatalogParams({ q: " a " })).toMatchObject({
      view: "lists",
      q: "a",
      hint: "query-too-short",
    });
  });

  it("treats a blank q as no search, without a hint", () => {
    expect(parseCatalogParams({ q: "   " })).toMatchObject({
      view: "lists",
      q: "",
      hint: null,
    });
  });

  it("caps the search text length", () => {
    const params = parseCatalogParams({ q: "x".repeat(500) });
    expect(params.q).toHaveLength(MAX_QUERY_LENGTH);
  });

  it("opens the category view for a category", () => {
    expect(
      parseCatalogParams({ category: "deals-collection-tvs", page: "2" }),
    ).toMatchObject({
      view: "category",
      category: "deals-collection-tvs",
      page: 2,
    });
  });

  it("lets the search win over the category", () => {
    expect(
      parseCatalogParams({ q: "air fryer", category: "deals-collection-tvs" }),
    ).toMatchObject({ view: "search", q: "air fryer", category: null });
  });

  it.each([
    ["NaN", "abc"],
    ["zero", "0"],
    ["negative", "-3"],
    ["decimal", "2.5"],
    ["empty", ""],
  ])("uses page 1 for a %s page", (_name, page) => {
    expect(parseCatalogParams({ q: "tv box", page }).page).toBe(1);
  });

  it("keeps a valid page and clamps huge ones", () => {
    expect(parseCatalogParams({ q: "tv box", page: "3" }).page).toBe(3);
    expect(parseCatalogParams({ q: "tv box", page: "99999999" }).page).toBe(
      10_000,
    );
  });

  it("always shows the first page of the lists", () => {
    expect(parseCatalogParams({ page: "4" }).page).toBe(1);
  });

  it("uses the first value of repeated params", () => {
    expect(
      parseCatalogParams({ q: ["lego", "duna"], page: ["2", "5"] }),
    ).toMatchObject({ q: "lego", page: 2 });
  });

  it("reads focus=search", () => {
    expect(parseCatalogParams({ focus: "search" }).focusSearch).toBe(true);
    expect(parseCatalogParams({ focus: "other" }).focusSearch).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("accepts import slugs and rejects anything else", () => {
    expect(isValidSlug("deals-collection-video-games")).toBe(true);
    expect(isValidSlug("tvs")).toBe(true);
    expect(isValidSlug("../etc")).toBe(false);
    expect(isValidSlug("a b")).toBe(false);
    expect(isValidSlug("-tvs")).toBe(false);
  });
});

describe("catalogHref", () => {
  it("builds canonical /home URLs", () => {
    expect(catalogHref({})).toBe("/home");
    expect(catalogHref({ category: "tvs" })).toBe("/home?category=tvs");
    expect(catalogHref({ category: "tvs", page: 1 })).toBe(
      "/home?category=tvs",
    );
    expect(catalogHref({ q: "smart tv", page: 2 })).toBe(
      "/home?q=smart+tv&page=2",
    );
  });
});
