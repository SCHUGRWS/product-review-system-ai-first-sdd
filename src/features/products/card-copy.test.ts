import { describe, expect, it } from "vitest";
import { createT } from "@/i18n/t";
import { amazonRatingCopy, communityCopy, reviewsLinkCopy } from "./card-copy";

const t = createT("en");
const pt = createT("pt-BR");

describe("communityCopy (the app's reviews on the card)", () => {
  it("says there are no reviews yet for 0 reviews", () => {
    expect(communityCopy(t, "en", { count: 0, average: null })).toEqual({
      kind: "none",
      label: "No reviews yet",
    });
  });

  it("shows 1 review with its rating", () => {
    expect(communityCopy(t, "en", { count: 1, average: 4 })).toEqual({
      kind: "reviews",
      label: "1 review here",
      average: "4.0",
      stars: 4,
    });
  });

  it("shows many reviews with the average to one decimal and rounded stars", () => {
    expect(communityCopy(t, "en", { count: 3, average: 3.67 })).toEqual({
      kind: "reviews",
      label: "3 reviews here",
      average: "3.7",
      stars: 4,
    });
    expect(
      communityCopy(t, "en", { count: 1234, average: 4.25 }),
    ).toMatchObject({
      label: "1,234 reviews here",
      average: "4.3",
      stars: 4,
    });
  });

  it("shows nothing when the numbers were not loaded", () => {
    expect(communityCopy(t, "en", undefined)).toBeNull();
  });
});

describe("amazonRatingCopy (Amazon's rating, labelled)", () => {
  it("labels the rating and its review count as Amazon's", () => {
    expect(amazonRatingCopy(t, "en", { rating: 4.6, reviewCount: 1234 })).toBe(
      "4.6 on Amazon (1,234 reviews)",
    );
    expect(amazonRatingCopy(t, "en", { rating: 4, reviewCount: 1 })).toBe(
      "4.0 on Amazon (1 review)",
    );
  });

  it("works without a review count and is null without a rating", () => {
    expect(amazonRatingCopy(t, "en", { rating: 3.9, reviewCount: null })).toBe(
      "3.9 on Amazon",
    );
    expect(
      amazonRatingCopy(t, "en", { rating: null, reviewCount: 120 }),
    ).toBeNull();
  });
});

describe("reviewsLinkCopy", () => {
  it('reads "See feedback" without reviews here', () => {
    expect(reviewsLinkCopy(t, "en", { count: 0, average: null })).toBe(
      "See feedback",
    );
    expect(reviewsLinkCopy(t, "en", undefined)).toBe("See feedback");
  });

  it("counts the reviews when there are some", () => {
    expect(reviewsLinkCopy(t, "en", { count: 1, average: 5 })).toBe(
      "See 1 review",
    );
    expect(reviewsLinkCopy(t, "en", { count: 3, average: 3.7 })).toBe(
      "See 3 reviews",
    );
    expect(reviewsLinkCopy(t, "en", { count: 1200, average: 4 })).toBe(
      "See 1,200 reviews",
    );
  });
});

describe("in Portuguese", () => {
  it("uses Brazilian number formats and words", () => {
    expect(communityCopy(pt, "pt-BR", { count: 1234, average: 4.25 })).toEqual({
      kind: "reviews",
      label: "1.234 avaliações aqui",
      average: "4,3",
      stars: 4,
    });
    expect(
      amazonRatingCopy(pt, "pt-BR", { rating: 4.6, reviewCount: 1234 }),
    ).toBe("4,6 na Amazon (1.234 avaliações)");
    expect(reviewsLinkCopy(pt, "pt-BR", undefined)).toBe("Ver avaliações");
  });
});
