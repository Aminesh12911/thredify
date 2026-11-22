"use client";

import { useState } from "react";
import { useCart, MAX_QTY } from "@/lib/cart/store";
import { useCoupon, couponActions } from "@/lib/cart/coupon";
import { computeTotals, couponStatus, normalizeCode, COUPONS, FREE_SHIPPING_MIN } from "@/lib/cart/pricing";
import { describeCustomization } from "@/lib/cart/describe";
import { useHydrated } from "@/lib/utils/localStore";
import { CartLineImage } from "./CartLineImage";
import { Totals } from "./Totals";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils/format";

export function CartClient() {
  const hydrated = useHydrated();
  const cart = useCart();
  const coupon = useCoupon();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const totals = computeTotals(cart.items, coupon);

  if (!hydrated) {
    return (
      <p role="status" className="py-24 text-center text-charcoal/60">
        Loading your cart…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-3xl bg-beige px-6 py-20 text-center">
        <h2 className="font-display text-3xl">Your cart is empty</h2>
        <p className="mx-auto mt-3 max-w-sm text-charcoal/70">Nothing here yet. Browse the collection or design your own tee.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop">Shop the collection</ButtonLink>
          <ButtonLink href="/studio" variant="secondary">Open the studio</ButtonLink>
        </div>
      </div>
    );
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const c = normalizeCode(code);
    if (!c) return setMsg({ ok: false, text: "Enter a coupon code." });
    const s = couponStatus(c, totals.subtotal);
    if (!s.valid) return setMsg({ ok: false, text: s.reason ?? "Invalid code." });
    couponActions.set(c);
    setCode("");
    setMsg({ ok: true, text: `${c} applied — ${COUPONS[c].label}.` });
  }

  const toFree = FREE_SHIPPING_MIN - totals.subtotal;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10" aria-label="Cart items">
        {cart.items.map((item) => (
          <li key={item.id} className="grid grid-cols-[96px_1fr] gap-4 py-6 sm:grid-cols-[120px_1fr]">
            <div className="rounded-2xl bg-beige p-2">
              <CartLineImage item={item} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg">{item.name}</h3>
                  <p className="text-sm text-charcoal/70">
                    Size {item.size} · {item.colorName}
                  </p>
                </div>
                <p className="tabular-nums">{formatINR(item.unitPrice * item.quantity)}</p>
              </div>
              {item.customization && (
                <ul className="mt-2 space-y-0.5 rounded-xl bg-ivory p-3 text-xs text-charcoal/70" aria-label="Customisation details">
                  {describeCustomization(item.customization).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-charcoal/50">{formatINR(item.unitPrice)} each</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex items-center rounded-full border border-charcoal/30" role="group" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" className="min-h-11 min-w-11 text-lg disabled:opacity-40" aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= 1} onClick={() => cart.setQuantity(item.id, item.quantity - 1)}>−</button>
                  <span className="min-w-8 text-center tabular-nums" aria-live="polite">{item.quantity}</span>
                  <button type="button" className="min-h-11 min-w-11 text-lg disabled:opacity-40" aria-label={`Increase quantity of ${item.name}`} disabled={item.quantity >= MAX_QTY} onClick={() => cart.setQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button type="button" onClick={() => cart.remove(item.id)} className="min-h-11 px-3 text-sm text-terracotta underline underline-offset-4" aria-label={`Remove ${item.name} from cart`}>
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl bg-ivory p-6 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 className="font-display text-2xl">Order summary</h2>

        <form onSubmit={apply} className="mt-5" noValidate>
          <label htmlFor="coupon" className="text-sm font-medium">Coupon code</label>
          <div className="mt-1 flex gap-2">
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. WELCOME10"
              autoCapitalize="characters"
              autoComplete="off"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-charcoal/25 bg-cream px-4 text-sm"
            />
            <Button type="submit" variant="secondary">Apply</Button>
          </div>
          <p role={msg && !msg.ok ? "alert" : "status"} className={`mt-2 min-h-5 text-sm ${msg?.ok ? "text-olive" : "text-terracotta"}`}>
            {msg?.text}
          </p>
          <p className="text-xs text-charcoal/50">Demo codes: WELCOME10, FLAT100 (₹799+), FREESHIP</p>
        </form>

        {coupon && (
          <p className="mt-3 flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
            <span>
              Code <strong>{normalizeCode(coupon)}</strong> {totals.couponApplied ? "applied" : "not active"}
              {totals.couponNote && <span className="block text-xs text-terracotta">{totals.couponNote}</span>}
            </span>
            <button type="button" className="min-h-11 px-2 text-xs underline underline-offset-4" onClick={() => { couponActions.set(null); setMsg(null); }}>
              Remove
            </button>
          </p>
        )}

        <div className="mt-6">
          <Totals totals={totals} />
        </div>
        {totals.shipping > 0 && toFree > 0 && (
          <p className="mt-3 text-xs text-charcoal/60">Add {formatINR(toFree)} more for free shipping.</p>
        )}
        <ButtonLink href="/checkout" className="mt-6 w-full">Proceed to checkout</ButtonLink>
        <ButtonLink href="/shop" variant="ghost" className="mt-2 w-full">Continue shopping</ButtonLink>
      </aside>
    </div>
  );
}
