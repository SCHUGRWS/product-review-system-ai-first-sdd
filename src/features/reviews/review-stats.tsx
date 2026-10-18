import { Stars } from "@/components/review-slip";
import { t } from "@/i18n/t";
import { type ProductReviewStats, STARS_DESC } from "./reviews.schema";
import {
  barPercent,
  formatAverage,
  reviewCountLabel,
  starsLabel,
} from "./reviews.utils";

// The app's own numbers for a product: average, count and 5..1 distribution.
export function ReviewStats({ stats }: { stats: ProductReviewStats }) {
  return (
    <section
      aria-labelledby="reviews-stats"
      data-testid="review-stats"
      className="h-fit rounded-md border border-rule px-6 py-6"
    >
      <h2
        id="reviews-stats"
        className="text-[1rem] font-bold tracking-[-0.01em] text-slate"
      >
        {t("reviews.stats.title")}
      </h2>

      {stats.average === null ? (
        <p className="mt-3 text-[1.25rem] font-semibold text-ink">
          {t("reviews.stats.noAverage")}
        </p>
      ) : (
        <>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="sr-only">
              {t("reviews.stats.averageLabel", {
                average: formatAverage(stats.average),
              })}
            </span>
            <span
              aria-hidden="true"
              data-testid="review-average"
              className="text-[3.052rem] leading-none font-extrabold tracking-[-0.04em] text-ink tabular-nums"
            >
              {formatAverage(stats.average)}
            </span>
            <span aria-hidden="true" className="text-[1rem] text-slate">
              {t("reviews.stats.outOf")}
            </span>
          </p>
          <div aria-hidden="true">
            <Stars
              rating={Math.round(stats.average)}
              className="mt-2 [&_svg]:size-4"
            />
          </div>
        </>
      )}
      <p
        data-testid="review-count"
        className="mt-2 text-[0.9375rem] text-slate"
      >
        {reviewCountLabel(stats.count)}
      </p>

      <dl
        aria-label={t("reviews.stats.distribution")}
        className="mt-5 flex flex-col gap-2"
      >
        {STARS_DESC.map((stars) => {
          const count = stats.distribution[stars];
          return (
            <div
              key={stars}
              data-testid={`distribution-${stars}`}
              className="grid grid-cols-[3.75rem_minmax(0,1fr)_2rem] items-center gap-3 text-[0.875rem]"
            >
              <dt className="text-slate">{starsLabel(stars)}</dt>
              <dd className="contents">
                <span
                  aria-hidden="true"
                  className="h-2 overflow-hidden rounded-full bg-mist"
                >
                  <span
                    className="block h-full rounded-full bg-cobalt"
                    style={{ width: `${barPercent(count, stats.count)}%` }}
                  />
                </span>
                <span className="text-right font-semibold text-ink tabular-nums">
                  <span aria-hidden="true">{count}</span>
                  <span className="sr-only">{reviewCountLabel(count)}</span>
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
