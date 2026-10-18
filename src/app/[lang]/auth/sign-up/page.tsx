import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.signUp")) };
}

export default function SignUpPage() {
  return <SignUpForm />;
}
