const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// 199994 -> "R$ 1.999,94" (Intl uses a non-breaking space after "R$").
export function formatPrice(cents: number) {
  return brl.format(cents / 100);
}

const count = new Intl.NumberFormat("en-US");

// 1234 -> "1,234"
export function formatCount(value: number) {
  return count.format(value);
}

// 1234 -> "1,234 reviews"; 1 -> "1 review" (UI copy is English)
export function formatReviewCount(reviews: number) {
  return `${formatCount(reviews)} ${reviews === 1 ? "review" : "reviews"}`;
}
