"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl">We hit a snag loading this page</h1>
      <p className="mt-4 max-w-md text-charcoal/70">{error.message?.startsWith("Could not load") ? "The store database couldn't be reached. Please try again in a moment." : "An unexpected error occurred. Nothing has been charged."}</p>
      <button type="button" onClick={reset} className="mt-8 inline-flex min-h-11 items-center rounded-full bg-charcoal px-6 text-sm font-medium text-ivory hover:bg-olive">Try again</button>
    </main>
  );
}
