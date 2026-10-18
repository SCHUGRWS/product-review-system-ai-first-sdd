import type { Product } from "@/features/products/product.types";
import { ProductCard } from "@/features/products/product-card";
import { cn } from "@/lib/utils";
import { ARRIVE, arriveDelay, GRID } from "./layout";

export function ProductGrid({
  products,
  label,
}: {
  products: Product[];
  label: string;
}) {
  return (
    <ul aria-label={label} className={cn(GRID, "mt-8")}>
      {products.map((product, index) => (
        <li
          key={product.id}
          className={cn("min-w-0", ARRIVE)}
          style={arriveDelay(index)}
        >
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
