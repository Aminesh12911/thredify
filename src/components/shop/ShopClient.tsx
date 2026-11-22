"use client";

import { useMemo, useState } from "react";
import type { Product, Size, Style } from "@/types";
import { SIZES } from "@/types";
import { ProductCard } from "./ProductCard";
import { QuickView } from "./QuickView";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/format";

type Sort = "newest" | "price-asc" | "price-desc";

const priceBuckets = [
  { id: "all", label: "Any price", test: () => true },
  { id: "u550", label: "Under ₹550", test: (p: number) => p < 550 },
  { id: "mid", label: "₹550 – ₹649", test: (p: number) => p >= 550 && p <= 649 },
  { id: "o650", label: "₹650 & above", test: (p: number) => p >= 650 },
] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-4 text-sm transition-colors",
        active ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/25 hover:border-charcoal"
      )}
    >
      {children}
    </button>
  );
}

export function ShopClient({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const [size, setSize] = useState<Size | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("all");
  const [style, setStyle] = useState<Style | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [quick, setQuick] = useState<Product | null>(null);

  const colorNames = useMemo(() => [...new Set(products.flatMap((p) => p.colors.map((c) => c.name)))], [products]);
  const styles = useMemo(() => [...new Set(products.map((p) => p.style))], [products]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const bucket = priceBuckets.find((b) => b.id === price)!;
    const list = products.filter(
      (p) =>
        (!term || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term)) &&
        (!size || p.sizes.includes(size)) &&
        (!color || p.colors.some((c) => c.name === color)) &&
        (!style || p.style === style) &&
        bucket.test(p.price)
    );
    return list.sort((a, b) =>
      sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt)
    );
  }, [products, q, size, color, price, style, sort]);

  const activeCount = [q.trim(), size, color, style, price !== "all"].filter(Boolean).length;
  const reset = () => {
    setQ("");
    setSize(null);
    setColor(null);
    setPrice("all");
    setStyle(null);
  };

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="shop-search" className="sr-only">Search products</label>
          <input
            id="shop-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search T-shirts…"
            className="min-h-11 w-full rounded-full border border-charcoal/25 bg-ivory px-5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="shop-sort" className="sr-only">Sort by</label>
          <select
            id="shop-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-11 w-full rounded-full border border-charcoal/25 bg-ivory px-4 text-sm sm:w-auto"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-charcoal/15 bg-ivory p-4" open>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
          Filters{activeCount > 0 ? ` (${activeCount} active)` : ""}
        </summary>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-widest text-charcoal/60">Style</legend>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <Chip key={s} active={style === s} onClick={() => setStyle(style === s ? null : s)}>{s}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-widest text-charcoal/60">Size</legend>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <Chip key={s} active={size === s} onClick={() => setSize(size === s ? null : s)}>{s}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-widest text-charcoal/60">Colour</legend>
            <div className="flex flex-wrap gap-2">
              {colorNames.map((c) => (
                <Chip key={c} active={color === c} onClick={() => setColor(color === c ? null : c)}>{c}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-widest text-charcoal/60">Price</legend>
            <div className="flex flex-wrap gap-2">
              {priceBuckets.map((b) => (
                <Chip key={b.id} active={price === b.id} onClick={() => setPrice(b.id)}>{b.label}</Chip>
              ))}
            </div>
          </fieldset>
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={reset} className="mt-4">Clear all filters</Button>
        )}
      </details>

      <p className="mt-6 text-sm text-charcoal/60" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "product" : "products"}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-beige px-6 py-16 text-center">
          <h2 className="font-display text-2xl">Nothing matches those filters</h2>
          <p className="mt-2 text-sm text-charcoal/70">Try a different search or clear your filters.</p>
          <Button onClick={reset} className="mt-6">Clear filters</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <div key={p.id}>
              <ProductCard product={p} />
              <button
                type="button"
                onClick={() => setQuick(p)}
                className="mt-3 min-h-11 text-sm underline underline-offset-4 hover:text-terracotta"
                aria-label={`Quick view ${p.name}`}
              >
                Quick view
              </button>
            </div>
          ))}
        </div>
      )}

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
