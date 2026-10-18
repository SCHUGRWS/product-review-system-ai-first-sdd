import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getLocale, getT } from "@/i18n/server";
import { PAGE_CONTAINER as CONTAINER } from "@/lib/layout";
import { homeHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

// Page frame shared by the streamed content and its skeleton, so swapping one
// for the other keeps every static heading and the main action in place.
export async function MeLayout({
  header,
  greeting,
  slip,
  account,
  feedback,
}: {
  header: React.ReactNode;
  greeting: React.ReactNode;
  slip?: React.ReactNode;
  account: React.ReactNode;
  feedback: React.ReactNode;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <>
      {header}
      <main className="flex-1">
        <section
          aria-labelledby="me-greeting"
          className="halftone-field overflow-hidden"
        >
          <div
            className={cn(
              CONTAINER,
              "grid items-center gap-10 py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:py-20",
            )}
          >
            <div>
              <h1
                id="me-greeting"
                className="text-[clamp(2.441rem,5.2vw,3.815rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-paper"
              >
                {greeting}
              </h1>
              <p className="mt-5 max-w-[38ch] text-[1.125rem] leading-relaxed text-paper/85">
                {t("me.lead")}
              </p>
              <Link
                href={`${homeHref(locale)}?focus=search`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-8 h-12 w-fit bg-paper px-6 text-[1rem] font-semibold text-cobalt shadow-[0_10px_24px_rgb(14_24_110/0.35)] hover:bg-mist focus-visible:ring-paper/60",
                )}
              >
                {t("me.writeFeedback")}
              </Link>
            </div>
            {/* Decorative: the same name is in the header */}
            <div aria-hidden="true" className="hidden justify-center md:flex">
              {slip}
            </div>
          </div>
        </section>

        <div
          className={cn(
            CONTAINER,
            "grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16",
          )}
        >
          <section aria-labelledby="me-recent-feedback" className="min-w-0">
            <h2
              id="me-recent-feedback"
              className="text-[1.563rem] leading-tight font-extrabold tracking-[-0.025em] text-ink"
            >
              {t("me.recentTitle")}
            </h2>
            <div className="mt-6">{feedback}</div>
          </section>

          <section
            aria-labelledby="me-account"
            className="h-fit rounded-md bg-mist px-6 py-6"
          >
            <h2
              id="me-account"
              className="text-[1rem] font-bold tracking-[-0.01em] text-slate"
            >
              {t("me.accountTitle")}
            </h2>
            {account}
          </section>
        </div>
      </main>
    </>
  );
}
