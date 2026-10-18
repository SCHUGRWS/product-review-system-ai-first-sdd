import { describe, expect, it } from "vitest";
import { amazonRatingCopy, communityCopy, reviewsLinkCopy } from "./card-copy";

describe("communityCopy (the app's reviews on the card)", () => {
  it("says there are no reviews yet for 0 reviews", () => {
    expect(communityCopy({ count: 0, average: null })).toEqual({
      kind: "none",
      label: "No reviews yet",
    });
  });

  it("shows 1 review with its rating", () => {
    expect(communityCopy({ count: 1, average: 4 })).toEqual({
      kind: "reviews",
      label: "1 review here",
      average: "4.0",
      stars: 4,
    });
  });

  it("shows many reviews with the average to one decimal and rounded stars", () => {
    expect(communityCopy({ count: 3, average: 3.67 })).toEqual({
      kind: "reviews",
      label: "3 reviews here",
      average: "3.7",
      stars: 4,
    });
    expect(communityCopy({ count: 1234, average: 4.25 })).toMatchObject({
      label: "1,234 reviews here",
      average: "4.3",
      stars: 4,
    });
  });

  it("shows nothing when the numbers were not loaded", () => {
    expect(communityCopy(undefined)).toBeNull();
  });
});

describe("amazonRatingCopy (Amazon's rating, labelled)", () => {
  it("labels the rating and its review count as Amazon's", () => {
    expect(amazonRatingCopy({ rating: 4.6, reviewCount: 1234 })).toBe(
      "4.6 on Amazon (1,234 reviews)",
    );
    expect(amazonRatingCopy({ rating: 4, reviewCount: 1 })).toBe(
      "4.0 on Amazon (1 review)",
    );
  });

  it("works without a review count and is null without a rating", () => {
    expect(amazonRatingCopy({ rating: 3.9, reviewCount: null })).toBe(
      "3.9 on Amazon",
    );
    expect(amazonRatingCopy({ rating: null, reviewCount: 120 })).toBeNull();
  });
});

describe("reviewsLinkCopy", () => {
  it('reads "See feedback" without reviews here', () => {
    expect(reviewsLinkCopy({ count: 0, average: null })).toBe("See feedback");
    expect(reviewsLinkCopy(undefined)).toBe("See feedback");
  });

  it("counts the reviews when there are some", () => {
    expect(reviewsLinkCopy({ count: 1, average: 5 })).toBe("See 1 review");
    expect(reviewsLinkCopy({ count: 3, average: 3.7 })).toBe("See 3 reviews");
    expect(reviewsLinkCopy({ count: 1200, average: 4 })).toBe(
      "See 1,200 reviews",
    );
  });
});
