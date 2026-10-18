"use client";

import { useState } from "react";
import { STAR_PATH } from "@/components/star-path";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const RATINGS = [1, 2, 3, 4, 5] as const;

type StarRatingInputProps = {
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
};

// Native radio group drawn as stars: arrow keys move and select, Tab enters and
// leaves the group, and screen readers announce "3 stars, 3 of 5".
export function StarRatingInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  invalid = false,
  describedBy,
  disabled = false,
}: StarRatingInputProps) {
  const t = useT();
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div
      role="radiogroup"
      id={id}
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      className="flex w-fit gap-1"
      onPointerLeave={() => setHovered(0)}
    >
      {RATINGS.map((n) => (
        <label
          key={n}
          className={cn(
            "cursor-pointer rounded-md p-1 text-cobalt transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-cobalt has-disabled:cursor-not-allowed has-disabled:opacity-50",
            invalid && shown === 0 && "text-destructive",
          )}
          onPointerEnter={() => !disabled && setHovered(n)}
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            disabled={disabled}
            onChange={() => onChange(n)}
            onBlur={onBlur}
            className="sr-only"
          />
          <span className="sr-only">
            {t(n === 1 ? "reviews.stars.one" : "reviews.stars.other", {
              count: n,
            })}
          </span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-8"
            fill={n <= shown ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
          >
            <path d={STAR_PATH} />
          </svg>
        </label>
      ))}
    </div>
  );
}
