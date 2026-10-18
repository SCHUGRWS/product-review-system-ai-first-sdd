import { cn } from "@/lib/utils";

export const STAR_PATH =
  "M12 2.5l2.94 6.1 6.56.86-4.8 4.6 1.2 6.54L12 17.4l-5.9 3.2 1.2-6.54-4.8-4.6 6.56-.86z";

export function Stars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cn("flex gap-1 text-cobalt", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5"
          fill={n <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

type ReviewSlipProps = {
  product: string;
  rating: number;
  author: React.ReactNode;
  detail?: string;
  children?: React.ReactNode;
  className?: string;
  quoteClassName?: string;
  /** Plays the one-time "printing" entrance */
  animate?: boolean;
};

// A review printed on a paper strip: the app's signature element.
export function ReviewSlip({
  product,
  rating,
  author,
  detail,
  children,
  className,
  quoteClassName,
  animate = false,
}: ReviewSlipProps) {
  return (
    <figure className={cn("slip-shadow relative w-full max-w-sm", className)}>
      <div
        className={cn(
          "review-slip bg-paper px-7 pt-9 pb-10 text-ink",
          animate && "animate-slip-print",
        )}
      >
        <p className="text-[0.8125rem] text-slate">{product}</p>
        <Stars rating={rating} className="mt-2" />
        <div
          className={cn(
            "mt-5 text-[1.25rem] leading-snug font-medium tracking-[-0.01em]",
            quoteClassName,
          )}
        >
          {children}
        </div>
        <figcaption className="mt-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-dashed border-rule pt-4 text-[0.875rem]">
          <span className="whitespace-nowrap text-slate">
            Review by{" "}
            <strong className="font-semibold text-ink">{author}</strong>
          </span>
          {detail && (
            <span className="whitespace-nowrap text-slate">{detail}</span>
          )}
        </figcaption>
      </div>
    </figure>
  );
}
