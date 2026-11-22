"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types";
import { isDemoMode } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useOrders } from "./store";
import { mapDbOrder, ORDER_SELECT, type DbOrderRow } from "./mapDb";

/**
 * Order history for the signed-in customer.
 * Supabase: row-level security returns only this user's orders.
 * Demo: orders saved in this browser whose email matches the account email.
 */
export function useMyOrders(user: { id: string; email: string } | null) {
  const local = useOrders();
  const [remote, setRemote] = useState<{ userId: string; orders: Order[]; failed: boolean } | null>(null);

  useEffect(() => {
    if (isDemoMode || !user) return;
    let cancelled = false;
    getBrowserSupabase()!
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setRemote({ userId: user.id, orders: error ? [] : (data as unknown as DbOrderRow[]).map(mapDbOrder), failed: Boolean(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return { orders: [] as Order[], loading: false, failed: false };
  if (isDemoMode) {
    const email = user.email.toLowerCase();
    return { orders: local.filter((o) => o.customer.email.toLowerCase() === email), loading: false, failed: false };
  }
  if (remote?.userId !== user.id) return { orders: [] as Order[], loading: true, failed: false };
  return { orders: remote.orders, loading: false, failed: remote.failed };
}
