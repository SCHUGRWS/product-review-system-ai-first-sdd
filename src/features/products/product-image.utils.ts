import { getImageProps } from "next/image";

// Product images load straight from Amazon (specs/product.md): next/image with
// `unoptimized`, so nothing goes through Vercel Image Optimization (Hobby
// quota). Responsive variants come from Amazon's own size token instead.

const IMAGE_HOST = "m.media-amazon.com";

/** Amazon's size token as imported, e.g. "._AC_SF226,226_QL85_.jpg" */
const SIZE_TOKEN = /\._AC_SF\d+,\d+_QL\d+_\.(jpe?g|png|webp)$/i;

/** 1x / 1.5x / 2x variants, same tokens Amazon's own deals page uses */
export const AMAZON_VARIANTS = [
  ["_AC_SF226,226_QL85_", "1x"],
  ["_AC_SF339,339_QL80_", "1.5x"],
  ["_AC_SF452,452_QL80_", "2x"],
] as const;

function isAmazonImage(url: string) {
  const parsed = URL.parse(url);
  return (
    parsed?.protocol === "https:" &&
    parsed.hostname === IMAGE_HOST &&
    parsed.pathname.startsWith("/images/")
  );
}

/**
 * srcSet for an Amazon product image: the size token rewritten for 1x, 1.5x
 * and 2x; the original URL alone when it has no known token; undefined for a
 * URL that is not an Amazon product image (rejected).
 */
export function amazonImageSrcSet(url: string): string | undefined {
  if (!isAmazonImage(url)) return undefined;
  const match = SIZE_TOKEN.exec(url);
  if (!match) return url;
  const base = url.slice(0, match.index);
  return AMAZON_VARIANTS.map(
    ([token, density]) => `${base}.${token}.${match[1]} ${density}`,
  ).join(", ");
}

export type ProductImageInput = {
  src: string;
  width: number;
  height: number;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * Attributes of a product <img>: next/image's own (fixed width and height,
 * lazy by default) with `unoptimized` always on, Amazon's srcSet and no
 * referrer. next/image drops a srcSet prop, so it is added here.
 */
export function productImageProps({ src, ...rest }: ProductImageInput) {
  const { props } = getImageProps({
    ...rest,
    src,
    alt: "",
    unoptimized: true,
  });
  return {
    ...props,
    srcSet: amazonImageSrcSet(src),
    referrerPolicy: "no-referrer" as const,
  };
}
