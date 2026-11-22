import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { BUSINESS, FAQ } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & FAQ",
  description: "Get in touch with THREADIFY or find answers to common questions about custom T-shirts, sandbox payments, shipping and tracking.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const topic = (await searchParams).topic === "custom" ? "custom_design" : "contact";
  return (
    <main className="container-page py-12 sm:py-16">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">We&apos;d love to hear from you</h1>
      <p className="mt-4 max-w-2xl rounded-2xl border border-terracotta/40 bg-ivory p-4 text-sm"><strong>Sample details.</strong> The email, phone and address below are placeholders for a demo store and are not monitored.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm initialKind={topic} />
        <aside className="h-fit space-y-5 rounded-3xl bg-beige p-6 sm:p-8" aria-label="Customer support details">
          <h2 className="font-display text-2xl">Customer support</h2>
          <dl className="space-y-4 text-sm">
            <div><dt className="eyebrow">Email</dt><dd className="mt-1"><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></dd></div>
            <div><dt className="eyebrow">Phone</dt><dd className="mt-1">{BUSINESS.phone}</dd></div>
            <div><dt className="eyebrow">Hours</dt><dd className="mt-1">{BUSINESS.hours}</dd></div>
            <div><dt className="eyebrow">Address</dt><dd className="mt-1">{BUSINESS.address.map((l) => <span key={l} className="block">{l}</span>)}</dd></div>
          </dl>
          <p className="text-sm text-charcoal/70">Already ordered? <Link href="/track" className="inline-flex min-h-11 items-center underline underline-offset-4">Track your order</Link></p>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="faq">
        <h2 id="faq" className="font-display text-3xl sm:text-4xl">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-charcoal/10 rounded-3xl bg-ivory px-6">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {f.q}<span aria-hidden="true" className="text-xl transition group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 text-charcoal/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
