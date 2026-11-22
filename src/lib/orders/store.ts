"use client";

import type { CartItem, Order, OrderStatus } from "@/types";
import { createLocalStore, useStore } from "@/lib/utils/localStore";
import { generateOrderCode } from "./code";

/**
 * DEMO MODE order storage: orders live in this browser only (localStorage).
 * Phase 6 adds a Supabase implementation behind the same function names.
 */
const EMPTY: Order[] = [];
const store = createLocalStore<Order[]>("threadify-orders-v1", EMPTY);

export const STATUS_FLOW: OrderStatus[] = ["placed", "processing", "printing", "shipped", "delivered"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order placed",
  processing: "Processing",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const normalizeOrderCode = (s: string) => s.trim().toUpperCase();

export function placeOrder(input: Omit<Order, "code" | "createdAt" | "status" | "imagesStripped">): {
  order: Order;
  persisted: boolean;
} {
  const orders = store.getSnapshot();
  const code = generateOrderCode(new Set(orders.map((o) => o.code)));
  let order: Order = { ...input, code, createdAt: new Date().toISOString(), status: "placed" };
  let persisted = store.set([order, ...orders]);
  if (!persisted) {
    // Storage full (large uploaded artwork): keep the order, drop the heavy image data.
    const lean: CartItem[] = order.items.map((i) =>
      i.customization
        ? {
            ...i,
            customization: {
              ...i.customization,
              layers: i.customization.layers.map((l) => ({ ...l, imageDataUrl: undefined })),
            },
          }
        : i
    );
    order = { ...order, items: lean, imagesStripped: true };
    persisted = store.set([order, ...orders]);
  }
  return { order, persisted };
}

export function advanceStatus(code: string) {
  const orders = store.getSnapshot();
  store.set(
    orders.map((o) => {
      if (o.code !== code) return o;
      const i = STATUS_FLOW.indexOf(o.status);
      return i >= 0 && i < STATUS_FLOW.length - 1 ? { ...o, status: STATUS_FLOW[i + 1] } : o;
    })
  );
}

export const useOrders = () => useStore(store);

export function findOrder(orders: Order[], code: string) {
  const c = normalizeOrderCode(code);
  return orders.find((o) => o.code === c);
}

export const getOrdersSnapshot = () => store.getSnapshot();

export function setStatus(code: string, status: OrderStatus) {
  store.set(store.getSnapshot().map((o) => (o.code === code ? { ...o, status } : o)));
}

/** Adds orders that aren't already present (used for the admin "load demo data" button). */
export function importOrders(incoming: Order[]) {
  const existing = store.getSnapshot();
  const have = new Set(existing.map((o) => o.code));
  const fresh = incoming.filter((o) => !have.has(o.code));
  if (fresh.length) store.set([...fresh, ...existing].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  return fresh.length;
}
