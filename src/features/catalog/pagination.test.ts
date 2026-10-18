import { describe, expect, it } from "vitest";
import { type PageLink, pageLinks } from "./page-links";

// Compact form: page numbers, "*" marks the current one, "…" a gap
function shape(links: PageLink[]) {
  return links.map((link) =>
    link.type === "gap" ? "…" : `${link.page}${link.current ? "*" : ""}`,
  );
}

describe("pageLinks", () => {
  it("returns nothing for a single page or no results", () => {
    expect(pageLinks(0, 1, 24)).toEqual([]);
    expect(pageLinks(24, 1, 24)).toEqual([]);
  });

  it("lists every page when there are few", () => {
    expect(shape(pageLinks(60, 2, 24))).toEqual(["1", "2*", "3"]);
  });

  it("shows the window around the current page with gaps", () => {
    expect(shape(pageLinks(24 * 20, 10, 24))).toEqual([
      "1",
      "…",
      "9",
      "10*",
      "11",
      "…",
      "20",
    ]);
  });

  it("starts at the first page", () => {
    expect(shape(pageLinks(24 * 20, 1, 24))).toEqual(["1*", "2", "…", "20"]);
  });

  it("ends at the last page", () => {
    expect(shape(pageLinks(24 * 20, 20, 24))).toEqual(["1", "…", "19", "20*"]);
  });

  it("shows a single hidden page instead of a gap", () => {
    expect(shape(pageLinks(24 * 7, 4, 24))).toEqual([
      "1",
      "2",
      "3",
      "4*",
      "5",
      "6",
      "7",
    ]);
  });

  it("clamps a page past the end to the last page", () => {
    expect(shape(pageLinks(48, 9, 24))).toEqual(["1", "2*"]);
  });
});
