"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { TShirtMockup, inkFor } from "@/components/ui/TShirtMockup";
import { PurchasePanel } from "./PurchasePanel";
import { productInfo, careInstructions } from "@/lib/products/sizeGuide";
import { cn } from "@/lib/utils/format";

const views = ["Front", "Back", "Detail"] as const;

export function ProductView({ product }: { product: Product }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [view, setView] = useState<(typeof views)[number]>("Front");
  const hex = product.colors[colorIdx].hex;

  const mockup = (v: (typeof views)[number], cls = "w-full") =>
    v === "Back" ? (
      <TShirtMockup color={hex} side="back" className={cls}>
        <text x="200" y="100" textAnchor="middle" fontSize="10" letterSpacing="4" fill={inkFor(hex)} opacity="0.7">
          THREADIFY
        </text>
        <text x="200" y="230" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="30" fill={inkFor(hex)}>
          {product.slogan}
        </text>
      </TShirtMockup>
    ) : (
      <TShirtMockup color={hex} slogan={product.slogan} className={cls} />
    );

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="overflow-hidden rounded-3xl bg-beige p-6 sm:p-10">
          {view === "Detail" ? (
            <div className="aspect-square overflow-hidden">
              <div className="origin-[50%_38%] scale-[2.4]">{mockup("Front")}</div>
            </div>
          ) : (
            mockup(view)
          )}
        </div>
        <div className="mt-3 flex gap-3" role="group" aria-label="Product images">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={v === view}
              aria-label={`${v} view`}
              className={cn(
                "w-20 overflow-hidden rounded-xl bg-beige p-1 transition-all",
                v === view ? "ring-2 ring-charcoal" : "opacity-70 hover:opacity-100"
              )}
            >
              {v === "Detail" ? (
                <div className="aspect-square overflow-hidden">
                  <div className="origin-[50%_38%] scale-[2.4]">{mockup("Front")}</div>
                </div>
              ) : (
                mockup(v)
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow">{product.category}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{product.name}</h1>
        <p className="mt-4 text-charcoal/70">{product.description}</p>
        <div className="mt-6">
          <PurchasePanel product={product} colorIdx={colorIdx} onColorChange={setColorIdx} />
        </div>

        <div className="mt-8 divide-y divide-charcoal/10 border-y border-charcoal/10">
          <details className="py-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">Product information</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-charcoal/70">
              {productInfo.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </details>
          <details className="py-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">Care instructions</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-charcoal/70">
              {careInstructions.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
