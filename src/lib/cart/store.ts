"use client";

import { useSyncExternalStore } from "react";
import type { CartItem } from "@/types";

/**
 * Browser-persisted cart (localStorage). Pricing, coupons and shipping are
 * layered on top in Phase 5; this module only owns the line items.
 */
const KEY = "threadify-cart-v1";
export const MAX_QTY = 10;

const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked (e.g. large custom artwork): cart still works this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => {
  load();
  return items;
};
const getServerSnapshot = () => EMPTY;

export const cartActions = {
  add(item: Omit<CartItem, "id">) {
    load();
    const isCustom = Boolean(item.customization);
    const match = isCustom
      ? undefined
      : items.find(
          (i) =>
            !i.customization &&
            i.productId === item.productId &&
            i.size === item.size &&
            i.colorName === item.colorName
        );
    if (match) {
      commit(
        items.map((i) =>
          i.id === match.id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + item.quantity) } : i
        )
      );
    } else {
      commit([
        ...items,
        { ...item, quantity: Math.min(MAX_QTY, item.quantity), id: crypto.randomUUID() },
      ]);
    }
  },
  setQuantity(id: string, quantity: number) {
    load();
    const q = Math.max(1, Math.min(MAX_QTY, Math.floor(quantity) || 1));
    commit(items.map((i) => (i.id === id ? { ...i, quantity: q } : i)));
  },
  remove(id: string) {
    load();
    commit(items.filter((i) => i.id !== id));
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = lines.reduce((n, i) => n + i.quantity, 0);
  return { items: lines, count, ...cartActions };
}
