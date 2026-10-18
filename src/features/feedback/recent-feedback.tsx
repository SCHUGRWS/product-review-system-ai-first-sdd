import Link from "next/link";
import { Stars } from "@/components/review-slip";
import type { Feedback } from "@/features/feedback/feedback.schema";
import { postedAgo } from "@/features/feedback/feedback.utils";
import { ProductImage } from "@/features/products/product-image";
import { getLocale, getT } from "@/i18n/server";
import { homeHref, productReviewsHref } from "@/lib/routes";
import { listFeedbackByAccount } from "@/server/feedback/queries";

const RECENT_LIMIT = 5;

// The signed-in user's latest feedback, rendered by /me inside <Suspense>.
// `userId` comes from requireUser() on that page, never from the client.
export async function RecentFeedback({ userId }: { userId: string }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  let feedback: Feedback[];
  try {
    feedback = await listFeedbackByAccount(userId, RECENT_LIMIT);
  } catch (error) {
    console.error("[RecentFeedback] failed to list feedback", error);
    return (
      <p role="alert" className="text-[1rem] text-destructive">
        {t("me.recent.loadFailed")}
      </p>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="review-slip bg-mist px-6 pt-8 pb-9">
        <p className="text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">
          {t("me.recent.emptyTitle")}
        </p>
        <p className="mt-1 max-w-[42ch] text-[1rem] text-slate">
          {t("me.recent.emptyBody")}
        </p>
        <Link
          href={homeHref(locale)}
          className="mt-4 inline-block rounded-sm text-[1rem] font-semibold text-cobalt underline underline-offset-4 hover:text-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
        >
          {t("me.recent.emptyCta")}
        </Link>
      </div>
    );
  }

  const now = new Date();
  return (
    <ol className="flex flex-col gap-4" data-testid="recent-feedback">
      {feedback.map((item) => (
        <li key={item.id}>
          <article
            aria-label={item.product?.title ?? item.productName}
            className="review-slip bg-mist px-6 pt-7 pb-8 text-ink"
          >
            <div className="flex items-start gap-4">
              {item.product && (
                <ProductImage
                  src={item.product.imageUrl}
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-md bg-paper object-contain p-0.5"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h3 className="min-w-0 text-[0.9375rem] font-medium text-slate [overflow-wrap:anywhere]">
                  {item.product ? (
                    <a
                      href={item.product.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="line-clamp-2 rounded-sm underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                    >
                      {item.product.title}
                      <span className="sr-only">
                        {" "}
                        {t("common.opensAmazon")}
                      </span>
                    </a>
                  ) : (
                    item.productName
                  )}
                </h3>
                <Stars rating={item.rating} className="[&_svg]:size-4" />
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] whitespace-pre-line [overflow-wrap:anywhere]">
              {item.comment}
            </p>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-dashed border-rule pt-3 text-[0.8125rem] text-slate">
              <time dateTime={item.createdAt.toISOString()}>
                {postedAgo(t, locale, item.createdAt, now)}
              </time>
              {item.product && (
                <Link
                  href={productReviewsHref(locale, item.product.id)}
                  className="rounded-sm font-semibold text-cobalt underline-offset-4 hover:text-cobalt-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  {t("reviews.seeAllReviews")}
                  <span className="sr-only">
                    {" "}
                    {t("reviews.ofProduct", { title: item.product.title })}
                  </span>
                </Link>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
