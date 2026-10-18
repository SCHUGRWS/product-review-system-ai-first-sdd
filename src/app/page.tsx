import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <SplitLayout
      panelFirstOnMobile={false}
      panel={
        <div className="relative grid w-full max-w-md place-items-center py-6">
          <ReviewSlip
            product="Cordless vacuum, 2nd generation"
            rating={3}
            author="Joon P."
            detail="Owned 1 year"
            className="col-start-1 row-start-1 max-w-[14.5rem] translate-x-4 -translate-y-6 rotate-[5deg] sm:max-w-[19rem] sm:translate-x-6 lg:translate-x-10 lg:-translate-y-8 opacity-90"
          >
            Strong suction, but the battery fades halfway through the stairs.
          </ReviewSlip>
          <ReviewSlip
            product="Stainless steel kettle, 1.7 L"
            rating={4}
            author="Marta S."
            detail="Owned 3 months"
            animate
            className="col-start-1 row-start-1 max-w-[16rem] -translate-x-1 translate-y-8 -rotate-[2.5deg] sm:max-w-sm sm:-translate-x-2 lg:-translate-x-4 lg:translate-y-10"
          >
            Boils fast and the lid doesn&apos;t drip. The handle gets warm after
            two cups, so I knocked off a star.
          </ReviewSlip>
        </div>
      }
    >
      <h1 className="max-w-[14ch] text-[clamp(2.441rem,5.6vw,3.815rem)] text-balance leading-[1.02] font-extrabold tracking-[-0.035em] text-ink">
        Reviews from people who actually bought it.
      </h1>
      <p className="mt-6 max-w-[34ch] text-[1.125rem] leading-relaxed text-slate">
        Read what owners say after weeks of real use, and post your own when a
        product earns it.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href="/auth/sign-up"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-fit px-6 text-[1rem] font-semibold hover:bg-cobalt-deep",
          )}
        >
          Create an account
        </Link>
        <Link
          href="/auth/sign-in"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-fit px-6 text-[1rem] font-semibold",
          )}
        >
          Sign in
        </Link>
      </div>
    </SplitLayout>
  );
}
