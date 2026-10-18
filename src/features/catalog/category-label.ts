import { categoryKey } from "@/features/products/categories";
import type { ProductCategoryRef } from "@/features/products/product.types";
import type { MessageKey } from "@/i18n/dictionaries/en";
import type { T } from "@/i18n/message";

// Label for a category in the UI language ("deals-collection-kitchen" ->
// "Kitchen" / "Cozinha"), falling back to the imported name for unknown slugs.
export function categoryLabel(t: T, category: ProductCategoryRef) {
  const key = categoryKey(category.slug);
  return key ? t(`category.${key}` as MessageKey) : category.name;
}
