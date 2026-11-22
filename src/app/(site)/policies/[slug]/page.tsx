import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicy, policies, POLICY_UPDATED } from "@/lib/policies/content";
import { BUSINESS } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => policies.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPolicy((await params).slug);
  return p ? { title: p.title, description: p.description, alternates: { canonical: `/policies/${p.slug}` } } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  const isContact = policy.slug === "contact-information";

  return (
    <main className="container-page max-w-3xl py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal/60">
        <Link href="/policies" className="inline-flex min-h-11 items-center underline underline-offset-4">Policies</Link> <span aria-hidden="true">/</span> <span>{policy.title}</span>
      </nav>
      <p className="eyebrow mt-4">Policies</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">{policy.title}</h1>
      <p role="note" className="mt-6 rounded-2xl border border-terracotta/40 bg-ivory p-4 text-sm">
        <strong>Draft — sample content.</strong> This page describes a fictional demo store and has not been reviewed by a lawyer. It must be reviewed and the placeholder details replaced before any commercial use. Last updated {POLICY_UPDATED}.
      </p>

      <div className="mt-10 space-y-8">
        {policy.sections.map((s) => (
          <section key={s.heading} aria-labelledby={`h-${s.heading.replace(/\W+/g, "-")}`}>
            <h2 id={`h-${s.heading.replace(/\W+/g, "-")}`} className="font-display text-2xl">{s.heading}</h2>
            {s.body.map((t) => <p key={t} className="mt-3 leading-relaxed text-charcoal/80">{t}</p>)}
            {s.list && <ul className="mt-3 list-disc space-y-2 pl-6 text-charcoal/80">{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
          </section>
        ))}
        {isContact && (
          <dl className="grid gap-4 rounded-3xl bg-ivory p-6 sm:grid-cols-2">
            <div><dt className="eyebrow">Business name</dt><dd className="mt-1">{BUSINESS.legalName}</dd></div>
            <div><dt className="eyebrow">Email</dt><dd className="mt-1"><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></dd></div>
            <div><dt className="eyebrow">Phone</dt><dd className="mt-1">{BUSINESS.phone}</dd></div>
            <div><dt className="eyebrow">Support hours</dt><dd className="mt-1">{BUSINESS.hours}</dd></div>
            <div className="sm:col-span-2"><dt className="eyebrow">Address</dt><dd className="mt-1">{BUSINESS.address.map((l) => <span key={l} className="block">{l}</span>)}</dd></div>
            <div className="sm:col-span-2"><dt className="eyebrow">Reply time</dt><dd className="mt-1">We aim to reply {BUSINESS.responseTime}.</dd></div>
          </dl>
        )}
      </div>
      <p className="mt-12 text-sm">Questions? <Link href="/contact" className="inline-flex min-h-11 items-center underline underline-offset-4">Contact us</Link></p>
    </main>
  );
}
