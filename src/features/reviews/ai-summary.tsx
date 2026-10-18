import { Minus, Plus } from "lucide-react";
import { ARRIVE } from "@/features/catalog/layout";
import type {
  SummaryLocale,
  SummaryResult,
} from "@/features/reviews/summary.schema";
import type { Locale } from "@/i18n/locales";
import type { T } from "@/i18n/message";
import { getLocale, getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { getOrCreateSummary } from "@/server/reviews/summary";
import { summaryFooter } from "./reviews.utils";

// AI summary of the community's opinion (specs/product-reviews.md, 3). The
// page renders it behind its own <Suspense>, so nothing else waits for the model.
export async function AiSummary({
  product,
  stats,
}: {
  product: { id: string; title: string };
  stats: { count: number; average: number | null };
}) {
  // The summary is written and cached in the viewer's language
  const locale: SummaryLocale = await getLocale();
  let result: SummaryResult;
  try {
    result = await getOrCreateSummary(product, locale, stats);
  } catch (error) {
    console.error("[AiSummary] failed to load the summary", error);
    result = { status: "unavailable" };
  }
  return <SummaryPanel result={result} t={await getT()} locale={locale} />;
}

const PANEL = "rounded-md bg-mist px-6 py-6 sm:px-8 sm:py-7";

function Label({ t }: { t: T }) {
  return (
    <p className="text-[0.875rem] font-semibold text-cobalt">
      {t("reviews.summary.label")}
    </p>
  );
}

// A quiet mist panel: the slips below stay the page's bold element.
export function SummaryPanel({
  result,
  t,
  locale,
}: {
  result: SummaryResult;
  t: T;
  locale: Locale;
}) {
  if (result.status !== "ready") {
    const [title, body] =
      result.status === "too-few"
        ? [t("reviews.summary.tooFew"), t("reviews.summary.tooFewBody")]
        : [
            t("reviews.summary.unavailable"),
            t("reviews.summary.unavailableBody"),
          ];
    return (
      <section
        aria-label={t("reviews.summary.label")}
        data-testid="ai-summary"
        data-state={result.status}
        className={PANEL}
      >
        <Label t={t} />
        <p className="mt-2 text-[1.125rem] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </p>
        <p className="mt-1 max-w-[60ch] text-[0.9375rem] text-slate">{body}</p>
      </section>
    );
  }

  const { summary } = result;
  return (
    <section
      aria-label={t("reviews.summary.label")}
      data-testid="ai-summary"
      data-state="ready"
      data-verdict={summary.verdict}
      // The page's one motion moment: the summary settles in when it streams
      className={cn(PANEL, ARRIVE)}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Label t={t} />
        <p className="rounded-full border border-cobalt/40 px-2.5 py-0.5 text-[0.8125rem] font-semibold text-cobalt">
          {t(`reviews.summary.verdict.${summary.verdict}`)}
        </p>
      </div>
      <h3 className="mt-3 text-[1.25rem] leading-snug font-bold tracking-[-0.015em] text-balance text-ink [overflow-wrap:anywhere]">
        {summary.headline}
      </h3>
      <p className="mt-2 max-w-[65ch] text-[1rem] leading-relaxed text-ink/85 [overflow-wrap:anywhere]">
        {summary.summary}
      </p>

      {(summary.pros.length > 0 || summary.cons.length > 0) && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Points
            title={t("reviews.summary.pros")}
            items={summary.pros}
            icon={<Plus aria-hidden="true" className="size-4" />}
          />
          <Points
            title={t("reviews.summary.cons")}
            items={summary.cons}
            icon={<Minus aria-hidden="true" className="size-4" />}
          />
        </div>
      )}

      <p className="mt-6 border-t border-dashed border-rule pt-3 text-[0.8125rem] text-slate">
        {summaryFooter(t, locale, result.reviewCount, result.generatedAt)}
      </p>
    </section>
  );
}

function Points({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div className="min-w-0">
      <h4 className="text-[0.875rem] font-bold text-slate">{title}</h4>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-[0.9375rem] leading-snug text-ink [overflow-wrap:anywhere]"
          >
            <span className="mt-0.5 shrink-0 text-cobalt">{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Same footprint as the panel while the summary loads (or is being written).
export async function AiSummarySkeleton() {
  const t = await getT();
  return (
    <section
      aria-busy="true"
      aria-label={t("reviews.summary.loading")}
      data-testid="ai-summary"
      data-state="loading"
      className={PANEL}
    >
      <Label t={t} />
      <div className="mt-3 h-6 w-3/4 rounded-sm bg-paper/80 motion-safe:animate-pulse" />
      <div className="mt-3 h-4 w-full rounded-sm bg-paper/80 motion-safe:animate-pulse" />
      <div className="mt-2 h-4 w-5/6 rounded-sm bg-paper/80 motion-safe:animate-pulse" />
    </section>
  );
}
