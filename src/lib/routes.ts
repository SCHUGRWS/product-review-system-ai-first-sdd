export const HOME_PATH = "/home";
export const ME_PATH = "/me";

export function productFeedbackHref(productId: string) {
  return `/products/${encodeURIComponent(productId)}/feedback`;
}

export function productReviewsHref(productId: string) {
  return `/products/${encodeURIComponent(productId)}`;
}
