import { notFound } from "next/navigation";
import { AlreadyReviewed } from "@/features/feedback/already-reviewed";
import {
  PRODUCT_ID_PATTERN,
  type ReviewedProduct,
} from "@/features/feedback/feedback.schema";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { shortName } from "@/lib/user-name";
import { requireUser } from "@/server/auth/current-user";
import { hasFeedbackForProduct } from "@/server/feedback/queries";
import { getProductById } from "@/server/products/queries";

// Content of /products/<id>/feedback (Server Component). It reads the session
// and the product, so the page renders it behind <Suspense>. Without a session
// requireUser() redirects to /auth/sign-in; an unknown product is a 404.
export async function ProductFeedback({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const user = await requireUser();

  // Ids that cannot be a product skip the database
  if (!PRODUCT_ID_PATTERN.test(productId)) notFound();
  const [found, reviewed] = await Promise.all([
    getProductById(productId),
    hasFeedbackForProduct(user.id, productId),
  ]);
  if (!found) notFound();

  // Only what the page shows reaches the HTML
  const product: ReviewedProduct = {
    id: found.id,
    title: found.title,
    imageUrl: found.imageUrl,
    url: found.url,
    priceCents: found.priceCents,
  };
  const author = shortName(user);

  if (reviewed) return <AlreadyReviewed product={product} author={author} />;
  return <FeedbackForm author={author} product={product} />;
}
