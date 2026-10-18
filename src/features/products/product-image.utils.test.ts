import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { amazonImageSrcSet, productImageProps } from "./product-image.utils";

const TOKEN_URL =
  "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg";

describe("amazonImageSrcSet", () => {
  it("rewrites the known size token for 1x, 1.5x and 2x", () => {
    expect(amazonImageSrcSet(TOKEN_URL)).toBe(
      [
        "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg 1x",
        "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF339,339_QL80_.jpg 1.5x",
        "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF452,452_QL80_.jpg 2x",
      ].join(", "),
    );
  });

  it("returns the original URL alone when there is no known token", () => {
    const plain = "https://m.media-amazon.com/images/I/41xYBNh9mTL.jpg";
    expect(amazonImageSrcSet(plain)).toBe(plain);
    const other =
      "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_UL320_.jpg";
    expect(amazonImageSrcSet(other)).toBe(other);
  });

  it("rejects URLs that are not Amazon product images", () => {
    expect(
      amazonImageSrcSet(
        "https://evil.example/images/I/x._AC_SF226,226_QL85_.jpg",
      ),
    ).toBeUndefined();
    expect(
      amazonImageSrcSet(
        "http://m.media-amazon.com/images/I/x._AC_SF226,226_QL85_.jpg",
      ),
    ).toBeUndefined();
    expect(
      amazonImageSrcSet(
        "https://m.media-amazon.com/other/x._AC_SF226,226_QL85_.jpg",
      ),
    ).toBeUndefined();
    expect(amazonImageSrcSet("not a url")).toBeUndefined();
  });
});

describe("productImageProps", () => {
  it("loads the image straight from Amazon, lazily, with a fixed size and no referrer", () => {
    const props = productImageProps({
      src: TOKEN_URL,
      width: 226,
      height: 226,
      className: "size-full",
    });

    expect(props).toMatchObject({
      src: TOKEN_URL,
      srcSet: amazonImageSrcSet(TOKEN_URL),
      alt: "",
      width: 226,
      height: 226,
      loading: "lazy",
      referrerPolicy: "no-referrer",
      className: "size-full",
    });
    expect(props.src).not.toContain("/_next/image");
  });

  it("keeps an explicit eager loading", () => {
    expect(
      productImageProps({
        src: TOKEN_URL,
        width: 176,
        height: 176,
        loading: "eager",
      }).loading,
    ).toBe("eager");
  });
});

// Every product image goes through <ProductImage> (unoptimized): no other
// file may render next/image, or Vercel would optimize it again.
describe("product images in the source", () => {
  const SRC = join(import.meta.dirname, "..", "..");
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")
        ? [path]
        : [];
    });
  const sources = files(SRC).map((path) => ({
    path: relative(SRC, path),
    text: readFileSync(path, "utf8"),
  }));

  it("imports next/image only in the unoptimized helper", () => {
    const users = sources
      .filter(({ text }) => /from\s+["']next\/(legacy\/)?image["']/.test(text))
      .map(({ path }) => path);
    expect(users).toEqual([
      join("features", "products", "product-image.utils.ts"),
    ]);
    const helper = sources.find(({ path }) => path === users[0])?.text ?? "";
    expect(helper).toMatch(/unoptimized: true/);
  });

  it("renders <img> only in ProductImage, and every product image uses it", () => {
    const imgs = sources
      .filter(({ path, text }) => path.endsWith(".tsx") && /<img\b/.test(text))
      .map(({ path }) => path);
    expect(imgs).toEqual([join("features", "products", "product-image.tsx")]);

    const withImageUrl = sources.filter(
      ({ path, text }) =>
        path.endsWith(".tsx") && /src=\{[^}]*imageUrl\}/.test(text),
    );
    expect(withImageUrl.length).toBeGreaterThanOrEqual(5);
    for (const { text } of withImageUrl) {
      expect(text).toContain("<ProductImage");
    }
  });
});
