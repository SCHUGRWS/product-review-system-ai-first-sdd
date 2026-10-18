import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Sign in | Product Review System",
};

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
  if (user) redirect("/home");
  return null;
}
