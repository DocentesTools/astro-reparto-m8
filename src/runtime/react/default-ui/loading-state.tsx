export interface RepartoLoadingStateProps {
  title?: string;
  description?: string;
  rows?: number;
}

/**
 * Runtime copy of the canonical `@mano8/astro-ui-m8` state-loading registry
 * block, adapted to the package's relative imports.
 */
export function RepartoLoadingState({
  title = "Loading",
  description = "Fetching the latest data.",
  rows = 3
}: RepartoLoadingStateProps) {
  const skeletonRows = Array.from(
    { length: Math.max(1, rows) },
    (_, index) => index
  );

  return (
    <div
      aria-live="polite"
      className="w-full max-w-none rounded-md border bg-card p-4 text-card-foreground"
      data-reparto-state="loading"
      role="status"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 space-y-3">
        {skeletonRows.map((row) => (
          <div
            className="h-8 w-full animate-pulse rounded-md bg-muted"
            data-slot="skeleton"
            key={row}
          />
        ))}
      </div>
    </div>
  );
}
