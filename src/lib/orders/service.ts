"use client";

import type { CartItem, OrderCustomer } from "@/types";
import { isDemoMode } from "@/lib/supabase/config";
import { simulatePayment, type PaymentScenario } from "@/lib/checkout/gateway";
import { placeOrder } from "./store";
import type { Totals } from "@/lib/cart/pricing";

export interface SubmitInput {
  customer: OrderCustomer;
  items: CartItem[];
  couponCode: string | null;
  totals: Totals;
  method: "UPI" | "Card" | "Net banking";
  scenario: PaymentScenario;
}

export type SubmitResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Places an order. Demo mode: simulated payment + browser storage.
 * Supabase mode: the server re-prices everything, runs the simulated payment and writes
 * the order atomically — the totals computed in the browser are NOT sent.
 */
export async function submitOrder(input: SubmitInput): Promise<SubmitResult> {
  if (isDemoMode) {
    const pay = await simulatePayment(input.scenario);
    if (pay.status === "failed") return { ok: false, error: pay.message };
    const { order } = placeOrder({
      customer: input.customer,
      items: input.items,
      subtotal: input.totals.subtotal,
      discount: input.totals.discount,
      shipping: input.totals.shipping,
      total: input.totals.total,
      couponCode: input.totals.couponApplied,
      payment: { status: "succeeded", provider: "sandbox-simulator", reference: pay.reference, method: input.method },
    });
    return { ok: true, code: order.code };
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: input.items.map((i) => ({
          productId: i.productId,
          size: i.size,
          colorName: i.colorName,
          quantity: i.quantity,
          customization: i.customization,
        })),
        couponCode: input.couponCode,
        customer: input.customer,
        method: input.method,
        scenario: input.scenario,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; error?: string };
    if (res.ok && data.ok && data.code) return { ok: true, code: data.code };
    return { ok: false, error: data.error ?? "Something went wrong placing your order. You have not been charged." };
  } catch {
    return { ok: false, error: "Network problem — your order was not placed and you have not been charged. Please try again." };
  }
}
