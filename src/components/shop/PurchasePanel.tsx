"use client";

import { useState } from "react";
import type { Product, Size } from "@/types";
import { Button } from "@/components/ui/Button";
import { useCart, MAX_QTY } from "@/lib/cart/store";
import { formatINR, cn } from "@/lib/utils/format";
import { sizeGuide } from "@/lib/products/sizeGuide";

interface Props {
  product: Product;
  colorIdx: number;
  onColorChange: (i: number) => void;
  compact?: boolean; // quick view hides the size guide
}

export function PurchasePanel({ product, colorIdx, onColorChange, compact }: Props) {
  const cart = useCart();
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const color = product.colors[colorIdx];

  function add() {
    if (!size) {
      setError("Please choose a size.");
      return;
    }
    setError("");
    cart.add({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: qty,
      size,
      colorName: color.name,
      colorHex: color.hex,
      slogan: product.slogan,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      <p className="text-2xl tabular-nums">{formatINR(product.price)}</p>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">
          Colour: <span className="font-normal text-charcoal/70">{color.name}</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onColorChange(i)}
              aria-label={c.name}
              aria-pressed={i === colorIdx}
              className={cn(
                "h-11 w-11 rounded-full border-2 transition-all",
                i === colorIdx ? "border-charcoal ring-2 ring-offset-2 ring-offset-cream ring-olive" : "border-charcoal/20"
              )}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Size</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSize(s);
                setError("");
              }}
              aria-pressed={s === size}
              className={cn(
                "min-h-11 min-w-12 rounded-full border px-4 text-sm transition-colors",
                s === size ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-terracotta">
            {error}
          </p>
        )}
      </fieldset>

      {!compact && (
        <details className="mt-4 rounded-xl border border-charcoal/15 bg-ivory p-4 text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center font-medium">Size guide (inches)</summary>
          <table className="mt-3 w-full text-left">
            <thead>
              <tr className="text-charcoal/60">
                <th className="py-1 font-medium">Size</th>
                <th className="font-medium">Chest</th>
                <th className="font-medium">Length</th>
                <th className="font-medium">Shoulder</th>
              </tr>
            </thead>
            <tbody>
              {sizeGuide.map((r) => (
                <tr key={r.size} className="border-t border-charcoal/10">
                  <td className="py-1.5 font-medium">{r.size}</td>
                  <td>{r.chest}</td>
                  <td>{r.length}</td>
                  <td>{r.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-charcoal/60">Sample measurements; allow ±1 inch.</p>
        </details>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="inline-flex items-center rounded-full border border-charcoal/30" role="group" aria-label="Quantity">
          <button
            type="button"
            className="min-h-11 min-w-11 text-lg disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-8 text-center tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="min-h-11 min-w-11 text-lg disabled:opacity-40"
            aria-label="Increase quantity"
            disabled={qty >= MAX_QTY}
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
          >
            +
          </button>
        </div>
        <Button onClick={add} className="flex-1">
          Add to cart
        </Button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-olive">
        {added ? `Added to cart. ${cart.count} item${cart.count === 1 ? "" : "s"} in your cart.` : ""}
      </p>
    </div>
  );
}
