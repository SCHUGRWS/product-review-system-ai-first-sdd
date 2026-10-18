// The product's name: a brand, written the same in every language.
export const APP_NAME = "Product Review System";

/** "<page> | Product Review System" */
export function pageTitle(page: string) {
  return `${page} | ${APP_NAME}`;
}
