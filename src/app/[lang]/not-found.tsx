import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import { getLocale, getT } from "@/i18n/server";
import { homeHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

// Localized 404: any /<locale>/... URL without a page ([...rest]) and
// notFound() calls without a closer not-found file. SplitLayout ends with the study-project footer.
export default async function NotFound() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <SplitLayout
      panel={
        <ReviewSlip
          product={t("notFound.slipProduct")}
          rating={0}
          author={t("notFound.slipAuthor")}
          className="max-w-[18rem] -rotate-2 sm:max-w-sm"
        >
          <div className="space-y-3 py-1">
            <div className="h-2.5 w-full rounded-full bg-mist" />
            <div className="h-2.5 w-2/3 rounded-full bg-mist" />
          </div>
        </ReviewSlip>
      }
    >
      <div className="w-full max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          {t("notFound.title")}
        </h1>
        <p className="mt-2 text-[1rem] text-slate">{t("notFound.body")}</p>
        <Link
          href={homeHref(locale)}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 h-12 w-fit px-6 text-[1rem] font-semibold hover:bg-cobalt-deep",
          )}
        >
          {t("notFound.cta")}
        </Link>
      </div>
    </SplitLayout>
  );
}
