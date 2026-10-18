import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { StudyNotice } from "@/components/site-footer";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import { getLocale, getT } from "@/i18n/server";
import { localeHref, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function Home() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <SplitLayout
      panelFirstOnMobile={false}
      footer={false}
      panel={
        <div className="relative grid w-full max-w-md place-items-center py-6">
          <ReviewSlip
            product={t("landing.slip1.product")}
            rating={3}
            author="Joon P."
            detail={t("landing.slip1.detail")}
            className="col-start-1 row-start-1 max-w-[14.5rem] translate-x-4 -translate-y-6 rotate-[5deg] sm:max-w-[19rem] sm:translate-x-6 lg:translate-x-10 lg:-translate-y-8 opacity-90"
          >
            {t("landing.slip1.quote")}
          </ReviewSlip>
          <ReviewSlip
            product={t("landing.slip2.product")}
            rating={4}
            author="Marta S."
            detail={t("landing.slip2.detail")}
            animate
            className="col-start-1 row-start-1 max-w-[16rem] -translate-x-1 translate-y-8 -rotate-[2.5deg] sm:max-w-sm sm:-translate-x-2 lg:-translate-x-4 lg:translate-y-10"
          >
            {t("landing.slip2.quote")}
          </ReviewSlip>
        </div>
      }
    >
      <h1 className="max-w-[14ch] text-[clamp(2.441rem,5.6vw,3.815rem)] text-balance leading-[1.02] font-extrabold tracking-[-0.035em] text-ink">
        {t("landing.title")}
      </h1>
      <p className="mt-6 max-w-[34ch] text-[1.125rem] leading-relaxed text-slate">
        {t("landing.lead")}
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href={localeHref(locale, SIGN_UP_PATH)}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-fit px-6 text-[1rem] font-semibold hover:bg-cobalt-deep",
          )}
        >
          {t("landing.signUp")}
        </Link>
        <Link
          href={localeHref(locale, SIGN_IN_PATH)}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-fit px-6 text-[1rem] font-semibold",
          )}
        >
          {t("landing.signIn")}
        </Link>
      </div>
      <StudyNotice className="mt-12" />
    </SplitLayout>
  );
}
