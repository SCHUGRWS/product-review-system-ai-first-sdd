"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLocale, useT } from "@/i18n/client";
import { errorMessage } from "@/i18n/errors";
import { signInHref } from "@/lib/routes";
import { useTRPC } from "@/trpc/client";

export function SignOutButton() {
  const router = useRouter();
  const trpc = useTRPC();
  const t = useT();
  const locale = useLocale();

  const signOut = useMutation(
    trpc.auth.signOut.mutationOptions({
      onSuccess: () => {
        router.replace(signInHref(locale));
        // Drop the signed-in pages kept in the client router cache
        router.refresh();
      },
      onError: (error) => {
        toast.error(errorMessage(t, error));
      },
    }),
  );

  // Stay disabled after success until the redirect hides the page
  const isPending = signOut.isPending || signOut.isSuccess;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => signOut.mutate()}
      className="h-9 px-3.5 text-[0.9375rem] font-semibold text-ink hover:border-cobalt hover:bg-paper hover:text-cobalt"
    >
      {isPending && <Spinner />}
      {isPending ? t("nav.signingOut") : t("nav.signOut")}
    </Button>
  );
}
