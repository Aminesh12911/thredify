import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 font-display text-5xl">We couldn&apos;t find that page</h1>
      <p className="mt-4 max-w-md text-charcoal/70">The link may be broken or the page may have moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-charcoal px-6 text-sm font-medium text-ivory hover:bg-olive">Back to home</Link>
        <Link href="/shop" className="inline-flex min-h-11 items-center rounded-full border border-charcoal px-6 text-sm font-medium hover:bg-charcoal hover:text-ivory">Shop</Link>
      </div>
    </main>
  );
}
