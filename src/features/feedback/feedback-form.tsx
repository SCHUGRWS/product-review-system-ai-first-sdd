"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMENT_MAX,
  type CreateFeedbackData,
  type CreateFeedbackInput,
  createFeedbackSchema,
  type ReviewedProduct,
} from "@/features/feedback/feedback.schema";
import { shortTitle } from "@/features/feedback/feedback.utils";
import { ProductSummary } from "@/features/feedback/product-summary";
import { StarRatingInput } from "@/features/feedback/star-rating-input";
import { ProductImage } from "@/features/products/product-image";
import { t } from "@/i18n/t";
import { HOME_PATH, ME_PATH, productReviewsHref } from "@/lib/routes";
import { useTRPC } from "@/trpc/client";

const FIELD_NAMES = ["rating", "comment"] as const;
const ID = "feedback";

export function FeedbackForm({
  author,
  product,
}: {
  author: string;
  product: ReviewedProduct;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<CreateFeedbackInput, unknown, CreateFeedbackData>({
    resolver: zodResolver(createFeedbackSchema),
    // 0 means "no star chosen yet"; the schema rejects it with "Choose a rating"
    // productId is fixed by the page; it is sent with the form data
    defaultValues: { productId: product.id, rating: 0, comment: "" },
  });
  const { errors } = form.formState;

  // With cacheComponents, Next.js hides this page with <Activity> instead of
  // unmounting it, so state survives navigation. After posting, reset the form
  // when the page is hidden so the next visit starts with a blank slip.
  const shouldReset = useRef(false);

  const create = useMutation(
    trpc.feedback.create.mutationOptions({
      onSuccess: async () => {
        shouldReset.current = true;
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.listMine.queryKey(),
        });
        const reviewsHref = productReviewsHref(product.id);
        toast.success("Feedback posted", {
          action: {
            label: t("reviews.seeAllReviews"),
            onClick: () => router.push(reviewsHref),
          },
        });
        router.push(ME_PATH);
      },
      onError: (error) => {
        const code = error.data?.code;
        if (code === "UNAUTHORIZED") {
          toast.error(error.message);
          router.push("/auth/sign-in");
          return;
        }
        // Already reviewed (409) or the product left the catalog (404): no
        // field can fix it, so the message goes under the form
        if (code === "CONFLICT" || code === "NOT_FOUND") {
          form.setError("root", { type: code, message: error.message });
          toast.error(error.message);
          return;
        }
        const fieldErrors: Partial<Record<string, string[]>> =
          error.data?.zodError?.fieldErrors ?? {};
        for (const name of FIELD_NAMES) {
          const message = fieldErrors[name]?.[0];
          if (message) form.setError(name, { message });
        }
        toast.error(error.message);
      },
    }),
  );

  const { reset: resetMutation } = create;
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
  const isPending = create.isPending || create.isSuccess;
  const comment = useWatch({ control: form.control, name: "comment" });

  return (
    <SplitLayout
      panel={
        <SlipPreview control={form.control} author={author} product={product} />
      }
    >
      <div className="w-full max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          Write feedback
        </h1>
        <p className="mt-2 text-[1rem] text-slate">
          Tell other buyers how the product held up. It is posted as{" "}
          <span className="font-semibold text-ink">{author}</span>
          {/* "Ada L." already ends the sentence */}
          {author.endsWith(".") ? "" : "."}
        </p>

        <ProductSummary product={product} className="mt-6" />

        <form
          noValidate
          className="mt-8"
          onSubmit={form.handleSubmit((data) => create.mutate(data))}
        >
          <FieldGroup className="gap-6">
            <Field data-invalid={!!errors.rating} className="gap-1.5">
              <FieldTitle
                id={`${ID}-rating-label`}
                className="text-[0.9375rem] font-medium"
              >
                Rating
              </FieldTitle>
              <Controller
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <StarRatingInput
                    id={`${ID}-rating`}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={!!errors.rating}
                    describedBy={
                      errors.rating ? `${ID}-rating-error` : undefined
                    }
                    disabled={isPending}
                  />
                )}
              />
              <FieldError id={`${ID}-rating-error`} errors={[errors.rating]} />
            </Field>

            <Field data-invalid={!!errors.comment} className="gap-1.5">
              <FieldLabel
                htmlFor={`${ID}-comment`}
                className="text-[0.9375rem] font-medium"
              >
                Comment
              </FieldLabel>
              <Textarea
                id={`${ID}-comment`}
                rows={5}
                maxLength={COMMENT_MAX}
                placeholder="What did you like, and what would you warn others about?"
                aria-invalid={!!errors.comment}
                aria-describedby={`${ID}-comment-count`}
                className="min-h-32 bg-paper px-3 py-2.5 text-[1rem] leading-relaxed md:text-[1rem]"
                {...form.register("comment")}
              />
              <div className="flex items-start justify-between gap-4">
                <FieldError errors={[errors.comment]} />
                <p
                  id={`${ID}-comment-count`}
                  className="ml-auto shrink-0 text-[0.8125rem] text-slate tabular-nums"
                >
                  {comment.length} of {COMMENT_MAX} characters
                </p>
              </div>
            </Field>

            <div className="mt-2 flex flex-col-reverse items-center gap-3 sm:flex-row">
              <Link
                href={HOME_PATH}
                className="rounded-sm px-2 py-1 text-[1rem] font-medium text-slate underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={isPending}
                className="h-12 w-full text-[1rem] font-semibold hover:bg-cobalt-deep sm:ml-auto sm:w-auto sm:px-8"
              >
                {isPending && <Spinner />}
                {isPending ? "Posting feedback..." : "Post feedback"}
              </Button>
            </div>
            {errors.root && (
              <div role="alert" className="text-[0.9375rem] text-destructive">
                <p>{errors.root.message}</p>
                {errors.root.type === "CONFLICT" && (
                  <Link
                    href={ME_PATH}
                    className="mt-1 inline-block rounded-sm font-semibold text-cobalt underline underline-offset-4 hover:text-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  >
                    See your reviews
                  </Link>
                )}
              </div>
            )}
          </FieldGroup>
        </form>
      </div>
    </SplitLayout>
  );
}

// The review slip as it will be printed, updated on every keystroke, with the
// product photo clipped to its corner.
function SlipPreview({
  control,
  author,
  product,
}: {
  control: Control<CreateFeedbackInput>;
  author: string;
  product: ReviewedProduct;
}) {
  const [rating, comment] = useWatch({ control, name: ["rating", "comment"] });
  const text = comment.trim();

  return (
    <div data-testid="slip-preview" className="flex w-full justify-center">
      <div className="relative w-full max-w-[18rem] -rotate-2 sm:max-w-sm">
        <ReviewSlip
          product={shortTitle(product.title)}
          rating={rating}
          author={author}
          animate
          className="max-w-none [&_.review-slip>p:first-child]:pr-16"
          quoteClassName="mt-3 line-clamp-3 text-[1.0625rem] whitespace-pre-line [overflow-wrap:anywhere] lg:mt-5 lg:line-clamp-[12] lg:text-[1.25rem]"
        >
          {text || (
            <span className="text-slate">
              Your comment appears here as you type.
            </span>
          )}
        </ReviewSlip>
        {/* Prints in with the slip: one motion moment for the page */}
        <div className="slip-shadow absolute -top-4 -right-3 rotate-6">
          <div className="animate-slip-print rounded-md bg-paper p-1.5">
            <ProductImage
              src={product.imageUrl}
              width={64}
              height={64}
              className="size-14 object-contain sm:size-16"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
