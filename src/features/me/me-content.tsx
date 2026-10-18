import { Suspense } from "react";
import { AppHeader, AppHeaderSkeleton } from "@/components/app-header";
import { ReviewSlip } from "@/components/review-slip";
import { RecentFeedback } from "@/features/feedback/recent-feedback";
import { getLocale, getT } from "@/i18n/server";
import { fullName, shortName } from "@/lib/user-name";
import { requireUser } from "@/server/auth/current-user";
import { AccountSummary, AccountSummarySkeleton } from "./account-summary";
import { LanguageSwitch } from "./language-switch";
import { greeting, memberSince } from "./me.utils";
import { MeLayout } from "./me-layout";
import { RecentFeedbackSkeleton } from "./recent-feedback-skeleton";

// Everything on /me that depends on the session. Reads the cookie, so the
// page renders it behind <Suspense>; without a session requireUser redirects.
export async function MeContent() {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  return (
    <MeLayout
      header={
        <AppHeader
          user={{ firstName: user.firstName, lastName: user.lastName }}
        />
      }
      greeting={greeting(t, user)}
      slip={<NextReviewSlip author={shortName(user)} />}
      account={
        <>
          <AccountSummary
            fullName={fullName(user)}
            email={user.email}
            memberSince={memberSince(t, locale, user.createdAt)}
          />
          <LanguageSwitch />
        </>
      }
      feedback={
        <Suspense fallback={<RecentFeedbackSkeleton />}>
          <RecentFeedback userId={user.id} />
        </Suspense>
      }
    />
  );
}

// Static stand-in for the whole page while the session is read.
export async function MeSkeleton() {
  const t = await getT();
  return (
    <MeLayout
      header={<AppHeaderSkeleton />}
      greeting={
        <>
          <span className="sr-only">{t("me.loading")}</span>
          <span
            aria-hidden="true"
            className="block h-[0.9em] w-[9ch] rounded-full bg-paper/15"
          />
        </>
      }
      account={<AccountSummarySkeleton />}
      feedback={<RecentFeedbackSkeleton />}
    />
  );
}

// A blank slip already signed with the user's name: the review they could write next.
// It prints in once, when the signed-in content arrives (the page's one motion moment).
async function NextReviewSlip({ author }: { author: string }) {
  const t = await getT();
  return (
    <ReviewSlip
      product={t("me.slipProduct")}
      rating={0}
      author={author}
      animate
      className="max-w-[20rem] rotate-[2.5deg]"
    >
      <div aria-hidden="true" className="space-y-3 py-1">
        <div className="h-2.5 w-full rounded-full bg-mist" />
        <div className="h-2.5 w-11/12 rounded-full bg-mist" />
        <div className="h-2.5 w-3/5 rounded-full bg-mist" />
      </div>
    </ReviewSlip>
  );
}
