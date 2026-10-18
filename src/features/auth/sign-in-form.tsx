"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type SignInData,
  type SignInInput,
  signInSchema,
} from "@/features/auth/sign-in.schema";
import { useLocale, useT, useTranslateMessage } from "@/i18n/client";
import { errorMessage } from "@/i18n/errors";
import { hasLocale } from "@/i18n/locales";
import { homeHref, localeHref, SIGN_UP_PATH } from "@/lib/routes";
import { useTRPC } from "@/trpc/client";

const FIELDS = [
  { name: "email", label: "auth.field.email", type: "email", auto: "email" },
  {
    name: "password",
    label: "auth.field.password",
    type: "password",
    auto: "current-password",
  },
] as const;

type SignInFormApi = ReturnType<
  typeof useForm<SignInInput, unknown, SignInData>
>;

export function SignInForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const t = useT();
  const locale = useLocale();
  const translate = useTranslateMessage();

  const form = useForm<SignInInput, unknown, SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  // With cacheComponents, Next.js hides this page with <Activity> instead of
  // unmounting it. After a successful sign-in, reset the form when the page is
  // hidden so the password is not kept around for the next visit.
  const shouldReset = useRef(false);

  const signIn = useMutation(
    trpc.auth.signIn.mutationOptions({
      onSuccess: (account) => {
        shouldReset.current = true;
        // The account's language wins (saved on /me); the cookie is already set
        const target = hasLocale(account.locale) ? account.locale : locale;
        if (target !== locale) {
          // Another root segment: load it fresh, with its own messages
          window.location.assign(homeHref(target));
          return;
        }
        router.replace(homeHref(target));
        // Server Components that read the session must render again
        router.refresh();
      },
      onError: (error) => {
        const message = errorMessage(t, error);
        if (error.data?.code === "UNAUTHORIZED") {
          form.setError("root", { message });
        }
        const fieldErrors: Partial<Record<string, string[]>> =
          error.data?.zodError?.fieldErrors ?? {};
        for (const field of FIELDS) {
          const message = fieldErrors[field.name]?.[0];
          if (message) form.setError(field.name, { message });
        }
        toast.error(message);
      },
    }),
  );

  const { reset: resetMutation } = signIn;
  const { reset: resetForm } = form;
  useLayoutEffect(() => {
    return () => {
      if (shouldReset.current) {
        shouldReset.current = false;
        resetMutation();
        resetForm();
      }
    };
  }, [resetMutation, resetForm]);

  // Keep the button disabled after success until the redirect hides the page
  const isPending = signIn.isPending || signIn.isSuccess;

  return (
    <SplitLayout panel={<WelcomeBackSlip />}>
      <div className="w-full max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          {t("auth.signIn.title")}
        </h1>
        <p className="mt-2 text-[1rem] text-slate">{t("auth.signIn.lead")}</p>

        <form
          noValidate
          className="mt-8"
          onSubmit={form.handleSubmit((data) => {
            form.clearErrors("root");
            signIn.mutate(data);
          })}
        >
          <FieldGroup className="gap-5">
            <FormField field={FIELDS[0]} form={form} />
            <FormField field={FIELDS[1]} form={form} />
            {errors.root && (
              <FieldError
                errors={[{ message: translate(errors.root.message) }]}
              />
            )}
            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-12 w-full text-[1rem] font-semibold hover:bg-cobalt-deep"
            >
              {isPending && <Spinner />}
              {isPending ? t("auth.signIn.pending") : t("auth.signIn.submit")}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-[0.9375rem] text-slate">
          {t("auth.signIn.noAccount")}{" "}
          <Link
            href={localeHref(locale, SIGN_UP_PATH)}
            className="rounded-sm font-semibold text-cobalt underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {t("auth.signIn.createOne")}
          </Link>
        </p>
      </div>
    </SplitLayout>
  );
}

// A returning owner's review, printed in as the page's one motion moment.
function WelcomeBackSlip() {
  const t = useT();
  return (
    <ReviewSlip
      product={t("auth.signIn.slip.product")}
      rating={5}
      author={t("common.you")}
      detail={t("auth.signIn.slip.detail")}
      animate
      className="max-w-[18rem] rotate-2 sm:max-w-sm"
      quoteClassName="mt-3 line-clamp-2 text-[1.0625rem] lg:mt-5 lg:line-clamp-none lg:text-[1.25rem]"
    >
      {t("auth.signIn.slip.quote")}
    </ReviewSlip>
  );
}

function FormField({
  field,
  form,
}: {
  field: (typeof FIELDS)[number];
  form: SignInFormApi;
}) {
  const t = useT();
  const translate = useTranslateMessage();
  const error = form.formState.errors[field.name];
  const id = `sign-in-${field.name}`;

  return (
    <Field data-invalid={!!error} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-[0.9375rem] font-medium">
        {t(field.label)}
      </FieldLabel>
      <Input
        id={id}
        type={field.type}
        autoComplete={field.auto}
        aria-invalid={!!error}
        className="h-11 bg-paper px-3 text-[1rem] md:text-[1rem]"
        {...form.register(field.name)}
      />
      <FieldError errors={[error && { message: translate(error.message) }]} />
    </Field>
  );
}
