import type { Metadata } from "next";
import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import { getLocale, getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";
import { signInHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.signUpSuccess")) };
}

export default async function SignUpSuccessPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <SplitLayout
      panel={
        <ReviewSlip
          product={t("auth.success.slipProduct")}
          rating={0}
          author={t("common.you")}
          className="max-w-[18rem] -rotate-2 sm:max-w-sm"
        >
          {/* Blank lines waiting to be written */}
          <div className="space-y-3 py-1">
            <div className="h-2.5 w-full rounded-full bg-mist" />
            <div className="h-2.5 w-11/12 rounded-full bg-mist" />
            <div className="h-2.5 w-2/3 rounded-full bg-mist" />
          </div>
          <div className="animate-stamp-land absolute top-1/2 left-1/2 -mt-16 -ml-20 grid size-40 place-items-center rounded-full border-[3px] border-cobalt text-center text-[1.05rem] leading-tight font-extrabold tracking-[-0.01em] text-cobalt mix-blend-multiply">
            <span className="rounded-full border border-cobalt/60 p-5">
              {t("auth.success.stampLine1")}
              <br />
              {t("auth.success.stampLine2")}
            </span>
          </div>
        </ReviewSlip>
      }
    >
      <div className="max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          {t("auth.success.title")}
        </h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate">
          {t("auth.success.body")}
        </p>
        <Link
          href={signInHref(locale)}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 h-12 w-fit px-6 text-[1rem] font-semibold hover:bg-cobalt-deep",
          )}
        >
          {t("auth.success.cta")}
        </Link>
      </div>
    </SplitLayout>
  );
}
