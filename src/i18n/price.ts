// Prices are always BRL ("R$ 1.999,94"), whatever the UI language: the deals
// are from Amazon Brazil. Its own module so client components can use it
// without pulling in the date-fns locales of ./format.ts.
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** 199994 -> "R$ 1.999,94" in every language (non-breaking space after "R$") */
export function formatPrice(cents: number) {
  return brl.format(cents / 100);
}
