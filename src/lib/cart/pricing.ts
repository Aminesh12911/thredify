import type { CartItem } from "@/types";

/** Shipping and coupon rules (demo values; keep in sync with the Shipping Policy page). */
export const FREE_SHIPPING_MIN = 999;
export const FLAT_SHIPPING = 79;

type Coupon =
  | { label: string; kind: "percent"; value: number; min?: number }
  | { label: string; kind: "flat"; value: number; min?: number }
  | { label: string; kind: "shipping"; min?: number };

export const COUPONS: Record<string, Coupon> = {
  WELCOME10: { label: "10% off your order", kind: "percent", value: 10 },
  FLAT100: { label: "₹100 off orders of ₹799+", kind: "flat", value: 100, min: 799 },
  FREESHIP: { label: "Free shipping", kind: "shipping" },
};

export const normalizeCode = (s: string) => s.trim().toUpperCase();

export function couponStatus(code: string, subtotal: number): { valid: boolean; reason?: string } {
  const c = COUPONS[normalizeCode(code)];
  if (!c) return { valid: false, reason: "That code isn't valid." };
  if (c.min && subtotal < c.min) return { valid: false, reason: `This code needs a minimum order of ₹${c.min}.` };
  return { valid: true };
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponApplied: string | null;
  couponNote: string | null;
}

export function computeTotals(
  items: Pick<CartItem, "unitPrice" | "quantity">[],
  couponCode: string | null
): Totals {
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  let discount = 0;
  let freeShip = false;
  let couponApplied: string | null = null;
  let couponNote: string | null = null;

  if (couponCode && items.length > 0) {
    const code = normalizeCode(couponCode);
    const status = couponStatus(code, subtotal);
    const c = COUPONS[code];
    if (status.valid && c) {
      couponApplied = code;
      if (c.kind === "percent") discount = Math.round((subtotal * c.value) / 100);
      if (c.kind === "flat") discount = Math.min(c.value, subtotal);
      if (c.kind === "shipping") freeShip = true;
    } else {
      couponNote = status.reason ?? null;
    }
  }

  const shipping = items.length === 0 || freeShip || subtotal >= FREE_SHIPPING_MIN ? 0 : FLAT_SHIPPING;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, couponApplied, couponNote };
}
