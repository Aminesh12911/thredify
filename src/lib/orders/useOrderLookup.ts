"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types";
import { isDemoMode } from "@/lib/supabase/config";
import { useOrders, findOrder } from "./store";

export type LookupState = "idle" | "loading" | "found" | "notfound" | "error";

/** Looks an order up by ID: browser storage in demo mode, the orders API in Supabase mode. */
export function useOrderLookup(code: string): { state: LookupState; order?: Order } {
  const local = useOrders();
  const [remote, setRemote] = useState<{ code: string; state: "found" | "notfound" | "error"; order?: Order } | null>(null);

  useEffect(() => {
    if (isDemoMode || !code) return;
    let cancelled = false;
    fetch(`/api/orders/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setRemote({ code, state: "notfound" });
        if (!res.ok) return setRemote({ code, state: "error" });
        const data = (await res.json()) as { order: Order };
        setRemote({ code, state: "found", order: data.order });
      })
      .catch(() => !cancelled && setRemote({ code, state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code) return { state: "idle" };
  if (isDemoMode) {
    const order = findOrder(local, code);
    return order ? { state: "found", order } : { state: "notfound" };
  }
  if (!remote || remote.code !== code) return { state: "loading" };
  return { state: remote.state, order: remote.order };
}
