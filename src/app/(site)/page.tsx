import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { TShirtMockup } from "@/components/ui/TShirtMockup";
import { ProductCard } from "@/components/shop/ProductCard";
import { Newsletter } from "@/components/home/Newsletter";
import { getProducts } from "@/lib/products/service";

export const metadata: Metadata = {
  title: { absolute: "THREADIFY — Wear Your Point of View" },
  description:
    "Minimal graphic T-shirts and a custom T-shirt studio. Design your own tee and see it live. Demo store for an academic project.",
};

const reasons = [
  ["Heavyweight cotton", "240 GSM combed cotton that holds its shape wash after wash."],
  ["Print-on-demand", "Every custom tee is printed to order, so nothing goes to waste."],
  ["Design it yourself", "Upload art, add text and place it exactly where you want."],
  ["Made for groups", "Societies, events and small businesses welcome — ask about bulk."],
];

const testimonials = [
  ["Finally a tee that doesn't shout. Fits great.", "Sample reviewer A, student"],
  ["Our society merch took ten minutes in the studio.", "Sample reviewer B, club lead"],
  ["The print placement tool is genuinely fun.", "Sample reviewer C, illustrator"],
];

// Re-read the catalogue at most once a minute when backed by Supabase.
export const revalidate = 60;

export default async function HomePage() {
  const seedProducts = await getProducts();
  const arrivals = [...seedProducts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const arrivalIds = new Set(arrivals.map((p) => p.id));
  // Featured excludes new arrivals so the two sections never repeat a product.
  const featured = [
    ...seedProducts.filter((p) => p.featured && !arrivalIds.has(p.id)),
    ...seedProducts.filter((p) => !p.featured && !arrivalIds.has(p.id)),
  ].slice(0, 3);

  return (
    <main className="page-enter">
      {/* Hero */}
      <section className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div>
          <p className="eyebrow">Custom T-Shirt Studio</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Wear Your Point of View.
          </h1>
          <p className="mt-6 max-w-md text-lg text-charcoal/70">
            Quietly confident graphic tees, and a studio where your own ideas become wearable. Minimal,
            premium, made for the way you see things.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/shop">SEE OUR COLLECTION</ButtonLink>
            <ButtonLink href="/studio" variant="secondary">
              Design your own
            </ButtonLink>
          </div>
        </div>
        <div className="rounded-[2rem] bg-beige p-8 sm:p-12">
          <TShirtMockup color="#667052" slogan="a point of view" className="mx-auto w-full max-w-sm" />
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-16" aria-labelledby="featured-title">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 id="featured-title" className="mt-2 font-display text-3xl sm:text-4xl">The collection</h2>
          </div>
          <ButtonLink href="/shop" variant="ghost">View all</ButtonLink>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-page py-16" aria-labelledby="arrivals-title">
        <p className="eyebrow">Just landed</p>
        <h2 id="arrivals-title" className="mt-2 font-display text-3xl sm:text-4xl">New arrivals</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {arrivals.map((p) => <ProductCard key={p.id} product={p} badge="New" />)}
        </div>
      </section>

      {/* Custom banner */}
      <section className="container-page py-8" aria-labelledby="custom-title">
        <div className="grid items-center gap-8 rounded-3xl bg-charcoal p-8 text-cream sm:p-14 md:grid-cols-2">
          <div>
            <p className="eyebrow !text-terracotta">Custom Studio</p>
            <h2 id="custom-title" className="mt-3 font-display text-3xl sm:text-4xl">Your art. Our cotton.</h2>
            <p className="mt-4 max-w-md text-cream/70">
              Choose a colour and fit, upload a PNG or JPG, add text, and drag it into place. Preview it live
              on the shirt before it goes in your cart.
            </p>
            <ButtonLink href="/studio" variant="accent" className="mt-8">Open the studio</ButtonLink>
          </div>
          <TShirtMockup color="#B87958" slogan="your idea here" className="mx-auto w-full max-w-xs" />
        </div>
      </section>

      {/* Brand story */}
      <section className="container-page py-20" aria-labelledby="story-title">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Our story</p>
          <h2 id="story-title" className="mt-3 font-display text-3xl sm:text-4xl">Started with a blank tee.</h2>
          <p className="mt-5 text-charcoal/70">
            THREADIFY began as a simple question: why should a T-shirt say what everyone else is saying? We
            make considered, minimal pieces for people who would rather wear an opinion than a logo.
          </p>
          <ButtonLink href="/about" variant="secondary" className="mt-8">Read more</ButtonLink>
        </div>
      </section>

      {/* Why choose */}
      <section className="container-page py-8" aria-labelledby="why-title">
        <h2 id="why-title" className="font-display text-3xl sm:text-4xl">Why THREADIFY</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(([t, d]) => (
            <li key={t} className="rounded-2xl bg-ivory p-6">
              <h3 className="font-display text-lg">{t}</h3>
              <p className="mt-2 text-sm text-charcoal/70">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Testimonials */}
      <section className="container-page py-20" aria-labelledby="reviews-title">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 id="reviews-title" className="font-display text-3xl sm:text-4xl">What people say</h2>
          <span className="rounded-full border border-charcoal/30 px-3 py-1 text-xs uppercase tracking-widest">
            Sample content
          </span>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map(([q, who]) => (
            <figure key={who} className="rounded-2xl bg-beige p-6">
              <blockquote className="font-display text-lg">“{q}”</blockquote>
              <figcaption className="mt-4 text-sm text-charcoal/60">{who}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
