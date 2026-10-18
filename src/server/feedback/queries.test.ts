import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./fake-db";

const db = createFakeDb();
vi.mock("@/server/db", () => ({ getDb: () => ({ from: db.from }) }));

const {
  insertFeedback,
  listFeedbackByAccount,
  hasFeedbackForProduct,
  toFeedback,
  FeedbackQueryError,
  FeedbackAlreadyExistsError,
} = await import("./queries");

const product = {
  id: "V1StGXR8_Z5jdHi6B-myT",
  title: "Chaleira Elétrica Inox 1,7L",
  imageUrl: "https://m.media-amazon.com/images/I/kettle.jpg",
  url: "https://www.amazon.com.br/dp/B0KETTLE01",
};

const row = {
  id: "fb_1",
  product_name: "Chaleira Elétrica Inox 1,7L",
  rating: 4,
  comment: "Boils fast and does not drip.",
  created_at: "2026-10-17T10:00:00+00:00",
};

const joinedRow = {
  ...row,
  product: {
    id: product.id,
    title: product.title,
    image_url: product.imageUrl,
    url: product.url,
  },
};

const legacyRow = {
  id: "fb_0",
  product_name: "Kettle",
  rating: 3,
  comment: "Typed product name from the first version.",
  created_at: "2026-10-16T10:00:00+00:00",
  product: null,
};

const data = { productId: product.id, rating: 4, comment: row.comment };

describe("toFeedback", () => {
  it("maps a joined row to camelCase with the product", () => {
    expect(toFeedback(joinedRow)).toEqual({
      id: "fb_1",
      product,
      productName: "Chaleira Elétrica Inox 1,7L",
      rating: 4,
      comment: "Boils fast and does not drip.",
      createdAt: new Date("2026-10-17T10:00:00Z"),
    });
  });

  it("maps a legacy row (no product) to product null with the saved name", () => {
    expect(toFeedback(legacyRow)).toMatchObject({
      product: null,
      productName: "Kettle",
    });
    const { product: _, ...withoutProduct } = legacyRow;
    expect(toFeedback(withoutProduct).product).toBeNull();
  });
});

describe("insertFeedback", () => {
  beforeEach(() => db.reset());

  it("stores product_id and the product title as a snapshot", async () => {
    db.resolveWith({ data: row, error: null });

    const feedback = await insertFeedback("acc_1", product, data);

    expect(db.from).toHaveBeenCalledWith("feedbacks");
    expect(db.builder.insert.mock.calls[0][0]).toEqual({
      id: expect.stringMatching(/^[A-Za-z0-9_-]{21}$/),
      account_id: "acc_1",
      product_id: product.id,
      product_name: "Chaleira Elétrica Inox 1,7L",
      rating: 4,
      comment: "Boils fast and does not drip.",
    });
    expect(feedback).toEqual(toFeedback(joinedRow));
  });

  it("returns only the review fields of a full catalog product", async () => {
    db.resolveWith({ data: row, error: null });

    const feedback = await insertFeedback(
      "acc_1",
      { ...product, priceCents: 9990, asin: "B0KETTLE01" } as typeof product,
      data,
    );

    expect(feedback.product).toEqual(product);
  });

  it("throws FeedbackAlreadyExistsError on a unique violation (23505)", async () => {
    db.resolveWith({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    await expect(insertFeedback("acc_1", product, data)).rejects.toBeInstanceOf(
      FeedbackAlreadyExistsError,
    );
  });

  it("throws FeedbackQueryError on other database errors", async () => {
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    const error = await insertFeedback("acc_1", product, data).catch((e) => e);
    expect(error).toBeInstanceOf(FeedbackQueryError);
    expect(error).not.toBeInstanceOf(FeedbackAlreadyExistsError);
  });
});

describe("listFeedbackByAccount", () => {
  beforeEach(() => db.reset());

  it("lists by account_id, newest first, with the joined product", async () => {
    db.resolveWith({ data: [joinedRow, legacyRow], error: null });

    const list = await listFeedbackByAccount("acc_1", 5);

    expect(db.from).toHaveBeenCalledWith("feedbacks");
    expect(db.builder.select).toHaveBeenCalledWith(
      expect.stringMatching(/product:products\s*\(id, title, image_url, url\)/),
    );
    expect(db.builder.eq).toHaveBeenCalledWith("account_id", "acc_1");
    expect(db.builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(db.builder.limit).toHaveBeenCalledWith(5);
    expect(list).toEqual([toFeedback(joinedRow), toFeedback(legacyRow)]);
    expect(list[1].product).toBeNull();
  });

  it("throws FeedbackQueryError on database errors", async () => {
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(listFeedbackByAccount("acc_1", 5)).rejects.toBeInstanceOf(
      FeedbackQueryError,
    );
  });
});

describe("hasFeedbackForProduct", () => {
  beforeEach(() => db.reset());

  it("is true when the account has a feedback for the product", async () => {
    db.resolveWith({ data: [{ id: "fb_1" }], error: null });

    await expect(hasFeedbackForProduct("acc_1", product.id)).resolves.toBe(
      true,
    );
    expect(db.builder.eq).toHaveBeenCalledWith("account_id", "acc_1");
    expect(db.builder.eq).toHaveBeenCalledWith("product_id", product.id);
    expect(db.builder.limit).toHaveBeenCalledWith(1);
  });

  it("is false when there is none", async () => {
    db.resolveWith({ data: [], error: null });

    await expect(hasFeedbackForProduct("acc_1", product.id)).resolves.toBe(
      false,
    );
  });

  it("throws FeedbackQueryError on database errors", async () => {
    db.resolveWith({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(
      hasFeedbackForProduct("acc_1", product.id),
    ).rejects.toBeInstanceOf(FeedbackQueryError);
  });
});
