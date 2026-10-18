// Placeholder with the same footprint as ProductCard, for Suspense fallbacks.
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col rounded-lg border border-rule/70 bg-paper p-3 motion-safe:animate-pulse"
    >
      <div className="aspect-square rounded-md bg-mist" />
      <div className="mt-3 h-4 w-11/12 rounded-sm bg-mist" />
      <div className="mt-1.5 h-4 w-2/3 rounded-sm bg-mist" />
      <div className="mt-3 h-5 w-1/2 rounded-sm bg-mist" />
      {/* The app's reviews, then the Amazon rating */}
      <div className="mt-2 h-3.5 w-1/2 rounded-sm bg-mist" />
      <div className="mt-1 h-3 w-2/5 rounded-sm bg-mist" />
      <div className="mt-auto flex flex-col gap-1.5 pt-3">
        <div className="h-8 rounded-lg bg-mist" />
        {/* "See feedback" is a quiet text button */}
        <div className="h-8" />
      </div>
    </div>
  );
}
