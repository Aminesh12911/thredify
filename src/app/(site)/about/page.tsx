import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "The story, mission, vision and values behind THREADIFY — a custom T-shirt studio concept built as an academic e-commerce project.",
  alternates: { canonical: "/about" },
};

const values = [
  ["Say something real", "Every tee starts with a point of view. We favour honest, quiet statements over noise."],
  ["Made to be worn", "Soft, breathable cotton and prints designed to last wash after wash."],
  ["Your design, your call", "The studio puts you in control of colour, placement and size — no templates you can't change."],
  ["Transparent by default", "Prices, shipping and policies are shown up front. No surprise charges at checkout."],
];
const why = [
  ["Design it yourself", "A live studio preview with text, artwork, front and back printing."],
  ["Clear pricing", "The server re-checks every price, so what you see is what you pay."],
  ["Track every step", "From placed to printing to delivered, with an order ID you can look up."],
  ["Honest demo", "Sandbox payments only, and we never ask for card details."],
];

export default function AboutPage() {
  return (
    <main>
      <section className="container-page py-14 sm:py-20">
        <p className="eyebrow">About THREADIFY</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">Wear Your Point of View.</h1>
        <p className="mt-6 max-w-2xl text-lg text-charcoal/75">THREADIFY is a custom T-shirt studio concept: ready-made graphic tees, and a studio where anyone can turn a line, a doodle or a photo into something wearable.</p>
        <p className="mt-4 max-w-2xl rounded-2xl border border-terracotta/40 bg-ivory p-4 text-sm"><strong>Demo store.</strong> THREADIFY was built as a semester project for IT &amp; E-Business Fundamentals. It is not a registered business and fulfils no real orders.</p>
      </section>

      <section className="bg-beige py-14 sm:py-20" aria-labelledby="story">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <h2 id="story" className="font-display text-4xl">Our story</h2>
          <div className="space-y-4 text-charcoal/80">
            <p>It began with a simple frustration: most T-shirts either say nothing or shout too much. We wanted tees for people who say more by saying less — and a way for them to make their own without a design degree.</p>
            <p>So the project pairs a small, considered collection with a studio that behaves the way you expect: drag, resize, preview, and see the price change as you go.</p>
            <p>Behind the scenes it is also a working example of a modern online store — catalogue, cart, checkout, accounts, order tracking and an admin dashboard.</p>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-14 sm:py-20 md:grid-cols-2">
        <div className="rounded-3xl bg-ivory p-8"><h2 className="eyebrow">Mission</h2><p className="mt-3 font-display text-2xl">Make personal expression simple, affordable and good-looking — on fabric you&apos;ll actually want to wear.</p></div>
        <div className="rounded-3xl bg-ivory p-8"><h2 className="eyebrow">Vision</h2><p className="mt-3 font-display text-2xl">A wardrobe where every piece says something its owner chose to say.</p></div>
      </section>

      <section className="container-page pb-14 sm:pb-20" aria-labelledby="values">
        <h2 id="values" className="font-display text-4xl">Brand values</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(([t, d]) => <li key={t} className="rounded-3xl border border-charcoal/10 p-6"><h3 className="font-display text-xl">{t}</h3><p className="mt-2 text-sm text-charcoal/70">{d}</p></li>)}
        </ul>
      </section>

      <section className="bg-charcoal py-14 text-cream sm:py-20" aria-labelledby="why">
        <div className="container-page">
          <h2 id="why" className="font-display text-4xl">Why choose THREADIFY</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {why.map(([t, d]) => <li key={t}><h3 className="font-display text-xl text-terracotta">{t}</h3><p className="mt-2 text-sm text-cream/75">{d}</p></li>)}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3"><ButtonLink href="/studio" variant="accent">Open the studio</ButtonLink><ButtonLink href="/shop" variant="secondary" className="!border-cream !text-cream hover:!bg-cream hover:!text-charcoal">Shop the collection</ButtonLink></div>
        </div>
      </section>
    </main>
  );
}
