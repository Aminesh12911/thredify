"use client";

import { useState } from "react";
import { advanceStatus, STATUS_LABEL, STATUS_FLOW } from "@/lib/orders/store";
import { useOrderLookup } from "@/lib/orders/useOrderLookup";
import { isDemoMode } from "@/lib/supabase/config";
import { useHydrated } from "@/lib/utils/localStore";
import { OrderTimeline } from "./OrderTimeline";
import { OrderDetails } from "./OrderDetails";
import { Button, ButtonLink } from "@/components/ui/Button";

/** Shared by the confirmation page (fixed code) and the tracking page (search box). */
export function OrderLookup({ fixedCode, initialCode = "" }: { fixedCode?: string; initialCode?: string }) {
  const hydrated = useHydrated();
  const [input, setInput] = useState(initialCode);
  const [submitted, setSubmitted] = useState(initialCode);
  const code = fixedCode ?? submitted;
  const normalized = code.trim().toUpperCase();
  const { state, order } = useOrderLookup(normalized);

  if (!hydrated) return <p role="status" className="py-16 text-center text-charcoal/60">Loading order…</p>;

  const confirmation = Boolean(fixedCode);

  return (
    <div>
      {!confirmation && (
        <form
          onSubmit={(e) => { e.preventDefault(); setSubmitted(input.trim()); }}
          className="flex max-w-xl flex-col gap-3 sm:flex-row"
          noValidate
        >
          <label htmlFor="order-code" className="sr-only">Order ID</label>
          <input
            id="order-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. THR-20261120-AB12C"
            autoComplete="off"
            className="min-h-11 flex-1 rounded-full border border-charcoal/25 bg-ivory px-5 text-sm"
          />
          <Button type="submit">Track order</Button>
        </form>
      )}

      {!confirmation && !code && (
        <p className="mt-6 text-sm text-charcoal/60">Enter the order ID from your confirmation page.</p>
      )}

      {state === "loading" && <p role="status" className="mt-8 text-charcoal/60">Looking up your order…</p>}

      {state === "error" && (
        <p role="alert" className="mt-8 rounded-2xl bg-beige p-4 text-sm">We couldn&apos;t look that up right now. Please try again in a moment.</p>
      )}

      {state === "notfound" && (
        <div role="alert" className="mt-8 rounded-3xl bg-beige px-6 py-14 text-center">
          <h2 className="font-display text-2xl">We couldn&apos;t find that order</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/70">
            Check the order ID for typos.{isDemoMode && " In demo mode, orders are saved only in the browser you placed them in."}
          </p>
          <ButtonLink href="/shop" className="mt-6">Continue shopping</ButtonLink>
        </div>
      )}

      {order && (
        <div className={confirmation ? "" : "mt-10"}>
          <div className="rounded-3xl bg-olive p-6 text-ivory sm:p-8">
            {confirmation && <p className="eyebrow !text-beige">Thank you</p>}
            <h2 className="mt-1 font-display text-3xl">
              {confirmation ? "Your (demo) order is confirmed" : `Order ${order.code}`}
            </h2>
            <p className="mt-2 text-sm text-ivory/80">
              Order ID: <strong data-testid="order-code" className="select-all tracking-wide">{order.code}</strong>
              {" · "}Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <p className="mt-1 text-sm text-ivory/80">
              A confirmation would be sent to {order.customer.email} (demo — no email is sent).
            </p>
          </div>

          <div className="mt-8 rounded-3xl bg-ivory p-6">
            <h3 className="font-display text-xl">
              Status: <span data-testid="order-status">{STATUS_LABEL[order.status]}</span>
            </h3>
            <div className="mt-4"><OrderTimeline status={order.status} /></div>
            {isDemoMode && order.status !== "cancelled" && order.status !== "delivered" && (
              <div className="mt-5 border-t border-charcoal/10 pt-4">
                <p className="text-xs text-charcoal/60">
                  Demo control: move this order to the next status ({STATUS_LABEL[STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]]}). In the admin dashboard (Phase 7) staff do this.
                </p>
                <Button variant="secondary" className="mt-2" onClick={() => advanceStatus(order.code)}>Advance demo status</Button>
              </div>
            )}
          </div>

          <div className="mt-10"><OrderDetails order={order} /></div>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/shop">Continue shopping</ButtonLink>
            {confirmation && <ButtonLink href="/track" variant="secondary">Track an order</ButtonLink>}
          </div>
        </div>
      )}
    </div>
  );
}
