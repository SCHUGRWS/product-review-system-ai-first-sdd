import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up | Product Review System",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
