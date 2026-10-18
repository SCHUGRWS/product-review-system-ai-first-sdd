import type { Metadata } from "next";
import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account created | Product Review System",
};

export default function SignUpSuccessPage() {
  return (
    <SplitLayout
      panel={
        <ReviewSlip
          product="Your first review"
          rating={0}
          author="you"
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
              Account
              <br />
              created
            </span>
          </div>
        </ReviewSlip>
      }
    >
      <div className="max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          Your account is ready
        </h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate">
          Reviews you write will appear under your name.
        </p>
        <Link
          href="/auth/sign-in"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 h-12 w-fit px-6 text-[1rem] font-semibold hover:bg-cobalt-deep",
          )}
        >
          Sign in
        </Link>
      </div>
    </SplitLayout>
  );
}
