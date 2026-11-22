"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { TShirtMockup } from "@/components/ui/TShirtMockup";
import { PurchasePanel } from "./PurchasePanel";

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (product && !d.open) d.showModal();
    if (!product && d.open) d.close();
  }, [product]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={product ? `Quick view: ${product.name}` : "Quick view"}
      className="m-auto w-[min(56rem,calc(100vw-1.5rem))] rounded-3xl bg-cream p-0 text-charcoal backdrop:bg-charcoal/50"
    >
      {product && <QuickViewBody key={product.id} product={product} onClose={onClose} />}
    </dialog>
  );
}

function QuickViewBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const [colorIdx, setColorIdx] = useState(0);
  return (
    <div className="relative grid gap-6 p-5 sm:p-8 md:grid-cols-2">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close quick view"
        className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-beige"
      >
        <svg width="18" height="18" viewBox="0 0 22 22" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden="true">
          <path d="M4 4l14 14M18 4L4 18" />
        </svg>
      </button>
      <div className="rounded-2xl bg-beige p-6">
        <TShirtMockup color={product.colors[colorIdx].hex} slogan={product.slogan} className="w-full" />
      </div>
      <div>
        <p className="eyebrow">{product.category}</p>
        <h2 className="mt-1 font-display text-3xl">{product.name}</h2>
        <p className="mt-2 text-sm text-charcoal/70">{product.description}</p>
        <div className="mt-4">
          <PurchasePanel product={product} colorIdx={colorIdx} onColorChange={setColorIdx} compact />
        </div>
        <Link href={`/shop/${product.slug}`} className="mt-2 inline-block text-sm underline underline-offset-4">
          View full details
        </Link>
      </div>
    </div>
  );
}
