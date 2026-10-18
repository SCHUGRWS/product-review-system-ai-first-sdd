import { describe, expect, it } from "vitest";
import { isMessageKey } from "@/i18n/dictionaries";
import { translateMessage } from "@/i18n/t";
import {
  createFeedbackSchema,
  hasReviewedSchema,
  listFeedbackSchema,
} from "./feedback.schema";

const PRODUCT_ID = "V1StGXR8_Z5jdHi6B-myT";

const valid = {
  productId: PRODUCT_ID,
  rating: 4,
  comment: "Boils fast and the lid does not drip.",
};

function fieldErrors(input: unknown) {
  const result = createFeedbackSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => {
      // Schemas return message keys; English is what the REST API shows
      expect(isMessageKey(issue.message)).toBe(true);
      return [issue.path.join("."), translateMessage("en", issue.message)];
    }),
  );
}

describe("createFeedbackSchema", () => {
  it("accepts valid data and trims the comment", () => {
    const data = createFeedbackSchema.parse({
      ...valid,
      comment: "   Boils fast, no drips.   ",
    });
    expect(data).toEqual({
      productId: PRODUCT_ID,
      rating: 4,
      comment: "Boils fast, no drips.",
    });
  });

  it("rejects a missing productId", () => {
    const { productId: _, ...rest } = valid;
    expect(fieldErrors(rest)).toEqual({
      productId: "Choose a product to review",
    });
  });

  it.each([
    ["empty", ""],
    ["too short", "abc"],
    ["too long", `${PRODUCT_ID}x`],
    ["with invalid characters", "V1StGXR8 Z5jdHi6B/myT"],
    ["a number", 123],
  ])("rejects a productId that is %s", (_label, productId) => {
    expect(fieldErrors({ ...valid, productId })).toEqual({
      productId: "Choose a product to review",
    });
  });

  it.each([
    [0, "Choose a rating"],
    [6, "Rating must be at most 5 stars"],
    [3.5, "Rating must be a whole number of stars"],
    ["3", "Choose a rating"],
  ])("rejects rating %j", (rating, message) => {
    expect(fieldErrors({ ...valid, rating })).toEqual({ rating: message });
  });

  it("accepts ratings 1 and 5", () => {
    expect(fieldErrors({ ...valid, rating: 1 })).toEqual({});
    expect(fieldErrors({ ...valid, rating: 5 })).toEqual({});
  });

  it("rejects a comment shorter than 10 characters after trim", () => {
    expect(fieldErrors({ ...valid, comment: "  ten chars!  " })).toEqual({});
    expect(fieldErrors({ ...valid, comment: "   short    " })).toEqual({
      comment: "Comment must have at least 10 characters",
    });
  });

  it("rejects a comment longer than 2000 characters after trim", () => {
    expect(fieldErrors({ ...valid, comment: ` ${"a".repeat(2000)} ` })).toEqual(
      {},
    );
    expect(fieldErrors({ ...valid, comment: "a".repeat(2001) })).toEqual({
      comment: "Comment must have at most 2000 characters",
    });
  });

  it("rejects missing fields", () => {
    expect(fieldErrors({})).toEqual({
      productId: "Choose a product to review",
      rating: "Choose a rating",
      comment: "Comment is required",
    });
  });

  it("strips a client-sent accountId and productName", () => {
    const data = createFeedbackSchema.parse({
      ...valid,
      accountId: "someone-else",
      productName: "Something else",
    });
    expect(data).toEqual(valid);
    expect(data).not.toHaveProperty("accountId");
    expect(data).not.toHaveProperty("productName");
  });
});

describe("hasReviewedSchema", () => {
  it("requires a well-formed productId", () => {
    expect(hasReviewedSchema.parse({ productId: PRODUCT_ID })).toEqual({
      productId: PRODUCT_ID,
    });
    expect(hasReviewedSchema.safeParse({ productId: "x" }).success).toBe(false);
  });
});

describe("listFeedbackSchema", () => {
  it("defaults the limit to 10", () => {
    expect(listFeedbackSchema.parse(undefined)).toEqual({ limit: 10 });
    expect(listFeedbackSchema.parse({})).toEqual({ limit: 10 });
  });

  it("accepts 1 to 50 and rejects values outside that range", () => {
    expect(listFeedbackSchema.parse({ limit: 50 })).toEqual({ limit: 50 });
    expect(listFeedbackSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listFeedbackSchema.safeParse({ limit: 51 }).success).toBe(false);
  });
});
