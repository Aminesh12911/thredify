import { ButtonLink } from "@/components/ui/Button";
import { TShirtMockup } from "@/components/ui/TShirtMockup";
import { seedProducts } from "@/lib/products/seed";
import { formatINR } from "@/lib/utils/format";
import { isDemoMode } from "@/lib/supabase/config";

const palette = [
  ["Warm cream", "#F3EFE6"],
  ["Dark charcoal", "#252820"],
  ["Olive green", "#667052"],
  ["Muted terracotta", "#B87958"],
  ["Light beige", "#E6E0D4"],
  ["White", "#FFFDF8"],
];

export default function Phase1Preview() {
  return (
    <main className="container-page page-enter py-16">
      <p className="eyebrow">Phase 1 — Foundation</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">THREADIFY design system</h1>
      <p className="mt-4 max-w-xl text-charcoal/70">
        Tokens, buttons and the vector T-shirt mockup are in place. The homepage arrives in Phase 2.
        Mode: <strong>{isDemoMode ? "Demo (no Supabase configured)" : "Supabase connected"}</strong>.
      </p>

      <section className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-6" aria-label="Colour palette">
        {palette.map(([name, hex]) => (
          <div key={hex} className="rounded-xl border border-charcoal/10 p-3" style={{ background: hex }}>
            <div className="h-12" />
            <p className="text-xs font-medium" style={{ color: hex === "#252820" || hex === "#667052" ? "#F3EFE6" : "#252820" }}>
              {name}
              <br />
              {hex}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href="/">Primary</ButtonLink>
        <ButtonLink href="/" variant="secondary">Secondary</ButtonLink>
        <ButtonLink href="/" variant="accent">Accent</ButtonLink>
        <ButtonLink href="/" variant="ghost">Ghost</ButtonLink>
      </section>

      <section className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3" aria-label="Sample products">
        {seedProducts.map((p) => (
          <article key={p.id} className="rounded-2xl bg-beige p-4">
            <TShirtMockup color={p.colors[0].hex} slogan={p.slogan} className="w-full" />
            <h2 className="mt-2 font-display text-xl">{p.name}</h2>
            <p className="text-sm text-charcoal/70">{formatINR(p.price)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
