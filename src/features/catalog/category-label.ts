import { categoryName } from "@/features/products/categories";
import type { ProductCategoryRef } from "@/features/products/product.types";

// English label for a category ("deals-collection-kitchen" -> "Kitchen"),
// falling back to the imported name for slugs without a label.
export function categoryLabel(category: ProductCategoryRef) {
  return categoryName(category.slug, category.name);
}
