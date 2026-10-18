import {
  type ProductImageInput,
  productImageProps,
} from "./product-image.utils";

// The only way product images are rendered: straight from Amazon, never
// through Vercel Image Optimization (product-image.utils.ts). Decorative: the
// product title next to it names the product.
export function ProductImage(props: ProductImageInput) {
  // biome-ignore lint/performance/noImgElement: next/image props (getImageProps, unoptimized) plus Amazon's srcSet, which <Image> drops
  return <img {...productImageProps(props)} alt="" />;
}
