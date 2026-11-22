"use client";

import { createLocalStore, useStore } from "@/lib/utils/localStore";

const store = createLocalStore<string | null>("threadify-coupon-v1", null);

export const couponActions = {
  set: (code: string | null) => store.set(code),
};

export const useCoupon = () => useStore(store);
