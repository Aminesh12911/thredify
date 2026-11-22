import type { Metadata } from "next";
import Link from "next/link";
import { policies } from "@/lib/policies/content";

export const metadata: Metadata = { title: "Policies", description: "Sample privacy, terms, refund, shipping and contact policies for the THREADIFY demo store.", alternates: { canonical: "/policies" } };

export default function PoliciesIndex() {
  return (
    <main className="container-page py-12 sm:py-16">
      <p className="eyebrow">Policies</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Store policies</h1>
      <p className="mt-4 max-w-2xl text-charcoal/70">Draft, sample policies for a fictional demo store. They show what a real shop would publish and must be reviewed before commercial use.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {policies.map((p) => (
          <li key={p.slug}>
            <Link href={`/policies/${p.slug}`} className="block h-full rounded-3xl bg-ivory p-6 transition hover:bg-beige">
              <h2 className="font-display text-2xl">{p.title}</h2>
              <p className="mt-2 text-sm text-charcoal/70">{p.short}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
