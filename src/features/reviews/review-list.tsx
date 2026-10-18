import Link from "next/link";
import { Stars } from "@/components/review-slip";
import { Pagination } from "@/features/catalog/pagination";
import { postedAgo } from "@/features/feedback/feedback.utils";
import type { Locale } from "@/i18n/locales";
import { getLocale, getT } from "@/i18n/server";
import { productFeedbackHref, productReviewsHref } from "@/lib/routes";
import type { ProductReview, ProductReviewPage } from "./reviews.schema";

const TEXT_LINK =
  "inline-block rounded-sm text-[1rem] font-semibold text-cobalt underline underline-offset-4 hover:text-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt";

function pageHref(locale: Locale, productId: string, page: number) {
  const base = productReviewsHref(locale, productId);
  return page > 1 ? `${base}?page=${page}` : base;
}

// The product's reviews as paper slips, newest first, 20 per page.
export async function ReviewList({
  productId,
  reviews,
  now = new Date(),
}: {
  productId: string;
  reviews: ProductReviewPage;
  now?: Date;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (reviews.total === 0) {
    return (
      <div
        data-testid="reviews-empty"
        className="review-slip bg-mist px-6 pt-8 pb-9"
      >
        <p className="text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">
          {t("reviews.empty.title")}
        </p>
        <p className="mt-1 max-w-[42ch] text-[1rem] text-slate">
          {t("reviews.empty.body")}
        </p>
        <Link
          href={productFeedbackHref(locale, productId)}
          className={`mt-4 ${TEXT_LINK}`}
        >
          {t("reviews.empty.cta")}
        </Link>
      </div>
    );
  }

  if (reviews.items.length === 0) {
    return (
      <div className="rounded-md bg-mist px-6 py-6">
        <p className="text-[1rem] text-slate">{t("reviews.pastEnd.body")}</p>
        <Link
          href={pageHref(locale, productId, 1)}
          className={`mt-2 ${TEXT_LINK}`}
        >
          {t("reviews.pastEnd.cta")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <ol data-testid="review-list" className="flex flex-col gap-7">
        {reviews.items.map((review) => (
          <li key={review.id}>
            <ReviewItem review={review} now={now} />
          </li>
        ))}
      </ol>
      <Pagination
        total={reviews.total}
        page={reviews.page}
        pageSize={reviews.pageSize}
        href={(page) => pageHref(locale, productId, page)}
      />
    </>
  );
}

async function ReviewItem({
  review,
  now,
}: {
  review: ProductReview;
  now: Date;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <figure className="slip-shadow">
      <div className="review-slip bg-paper px-6 pt-8 pb-9 text-ink sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Stars rating={review.rating} className="[&_svg]:size-4.5" />
          <time
            dateTime={review.createdAt.toISOString()}
            className="text-[0.8125rem] text-slate"
          >
            {postedAgo(t, locale, review.createdAt, now)}
          </time>
        </div>
        <blockquote className="mt-4 text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] whitespace-pre-line [overflow-wrap:anywhere]">
          {review.comment}
        </blockquote>
        <figcaption className="mt-6 border-t border-dashed border-rule pt-3 text-[0.875rem] text-slate">
          {t("reviews.list.reviewBy")}{" "}
          <strong className="font-semibold text-ink">
            {review.author ?? t("reviews.list.formerMember")}
          </strong>
        </figcaption>
      </div>
    </figure>
  );
}
