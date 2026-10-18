"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
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
  type SignUpData,
  type SignUpInput,
  signUpSchema,
} from "@/features/auth/sign-up.schema";
import { useTRPC } from "@/trpc/client";

const FIELDS = [
  { name: "firstName", label: "First name", type: "text", auto: "given-name" },
  { name: "lastName", label: "Last name", type: "text", auto: "family-name" },
  { name: "email", label: "Email", type: "email", auto: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    auto: "new-password",
    hint: "At least 8 characters",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    auto: "new-password",
  },
] as const;

type SignUpFormApi = ReturnType<
  typeof useForm<SignUpInput, unknown, SignUpData>
>;

export function SignUpForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const form = useForm<SignUpInput, unknown, SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { errors } = form.formState;

  // With cacheComponents, Next.js hides this page with <Activity> instead of
  // unmounting it, so state survives navigation. After a successful sign-up,
  // reset the form when the page is hidden so returning to it starts fresh.
  const shouldReset = useRef(false);

  const signUp = useMutation(
    trpc.auth.signUp.mutationOptions({
      onSuccess: () => {
        shouldReset.current = true;
        router.push("/auth/sign-up/success");
      },
      onError: (error) => {
        if (error.data?.code === "CONFLICT") {
          form.setError("email", { message: error.message });
        }
        const fieldErrors: Partial<Record<string, string[]>> =
          error.data?.zodError?.fieldErrors ?? {};
        for (const field of FIELDS) {
          const message = fieldErrors[field.name]?.[0];
          if (message) form.setError(field.name, { message });
        }
        toast.error(error.message);
      },
    }),
  );

  const { reset: resetMutation } = signUp;
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
  const isPending = signUp.isPending || signUp.isSuccess;

  return (
    <SplitLayout panel={<NamePreview control={form.control} />}>
      <div className="w-full max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-[1rem] text-slate">
          Your name appears on every review you post.
        </p>

        <form
          noValidate
          className="mt-8"
          onSubmit={form.handleSubmit((data) => signUp.mutate(data))}
        >
          <FieldGroup className="gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField field={FIELDS[0]} form={form} />
              <FormField field={FIELDS[1]} form={form} />
            </div>
            <FormField field={FIELDS[2]} form={form} />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField field={FIELDS[3]} form={form} />
              <FormField field={FIELDS[4]} form={form} />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-12 w-full text-[1rem] font-semibold hover:bg-cobalt-deep"
            >
              {isPending && <Spinner />}
              {isPending ? "Creating account..." : "Create account"}
            </Button>
            {errors.root && <FieldError errors={[errors.root]} />}
          </FieldGroup>
        </form>

        <p className="mt-6 text-[0.9375rem] text-slate">
          Already have an account?{" "}
          <Link
            href="/auth/sign-in"
            className="rounded-sm font-semibold text-cobalt underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            Sign in
          </Link>
        </p>
      </div>
    </SplitLayout>
  );
}

// Live preview of how the person's name will be printed on their reviews.
function NamePreview({ control }: { control: Control<SignUpInput> }) {
  const [firstName, lastName] = useWatch({
    control,
    name: ["firstName", "lastName"],
  });
  const first = firstName.trim();
  const initial = lastName.trim().charAt(0).toUpperCase();
  const author = first ? `${first}${initial ? ` ${initial}.` : ""}` : "you";

  return (
    <ReviewSlip
      product="Noise-cancelling headphones"
      rating={4}
      author={<span data-testid="slip-author">{author}</span>}
      detail="Owned 2 months"
      animate
      className="max-w-[18rem] -rotate-2 sm:max-w-sm"
      quoteClassName="mt-3 line-clamp-2 text-[1.0625rem] lg:mt-5 lg:line-clamp-none lg:text-[1.25rem]"
    >
      Quiet on the train and comfortable for a full workday. The case is bulkier
      than it needs to be.
    </ReviewSlip>
  );
}

function FormField({
  field,
  form,
}: {
  field: (typeof FIELDS)[number];
  form: SignUpFormApi;
}) {
  const error = form.formState.errors[field.name];
  const id = `sign-up-${field.name}`;
  const hint = "hint" in field ? field.hint : undefined;

  return (
    <Field data-invalid={!!error} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-[0.9375rem] font-medium">
        {field.label}
      </FieldLabel>
      <Input
        id={id}
        type={field.type}
        autoComplete={field.auto}
        aria-invalid={!!error}
        aria-describedby={hint && !error ? `${id}-hint` : undefined}
        className="h-11 bg-paper px-3 text-[1rem] md:text-[1rem]"
        {...form.register(field.name)}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-slate">
          {hint}
        </p>
      )}
      <FieldError errors={[error]} />
    </Field>
  );
}
