import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getLocale, getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";
import { homeHref } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.signIn")) };
}

export default function SignInPage() {
  return (
    <>
      <SignInForm />
      {/* Reads the session cookie, so it streams in behind its own boundary */}
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
    </>
  );
}

async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(homeHref(await getLocale()));
  return null;
}
