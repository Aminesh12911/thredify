import Link from "next/link";
import type { Product } from "@/types";
import { TShirtMockup } from "@/components/ui/TShirtMockup";
import { formatINR } from "@/lib/utils/format";

export function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-beige p-6 transition-colors duration-500 group-hover:bg-[#ddd6c6]">
          {badge && (
            <span className="absolute left-4 top-4 rounded-full bg-terracotta px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-ivory">
              {badge}
            </span>
          )}
          <TShirtMockup
            color={product.colors[0].hex}
            slogan={product.slogan}
            className="w-full transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
          />
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-lg">{product.name}</h3>
          <p className="text-sm tabular-nums">{formatINR(product.price)}</p>
        </div>
        <p className="mt-1 text-sm text-charcoal/60">
          {product.category} · {product.colors.length} colours
        </p>
      </Link>
    </article>
  );
}
