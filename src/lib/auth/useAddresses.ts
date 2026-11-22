"use client";

import { useCallback, useEffect, useState } from "react";
import { isDemoMode } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createLocalStore, useStore } from "@/lib/utils/localStore";
import type { Address, NewAddress } from "./types";

export const MAX_ADDRESSES = 5;

const EMPTY: Record<string, Address[]> = {};
const demoStore = createLocalStore<Record<string, Address[]>>("threadify-demo-addresses-v1", EMPTY);

interface Row {
  id: string;
  line1: string;
  city: string;
  state: string;
  pin_code: string;
  is_default: boolean;
}
const fromRow = (r: Row): Address => ({ id: r.id, line1: r.line1, city: r.city, state: r.state, pin: r.pin_code, isDefault: r.is_default });

/** Saved addresses for the signed-in customer (browser storage in demo mode, `addresses` table with RLS otherwise). */
export function useAddresses(userId: string | undefined) {
  const demo = useStore(demoStore);
  const [remote, setRemote] = useState<{ userId: string; list: Address[] } | null>(null);
  const [error, setError] = useState("");

  const fetchList = useCallback(async (): Promise<Address[] | null> => {
    if (isDemoMode || !userId) return null;
    const { data, error: e } = await getBrowserSupabase()!
      .from("addresses")
      .select("id, line1, city, state, pin_code, is_default")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    return e ? null : (data as Row[]).map(fromRow);
  }, [userId]);

  const refresh = useCallback(async () => {
    const list = await fetchList();
    if (list && userId) setRemote({ userId, list });
    else if (!list) setError("Couldn't load your addresses.");
  }, [fetchList, userId]);

  useEffect(() => {
    if (isDemoMode || !userId) return;
    let cancelled = false;
    fetchList().then((list) => {
      if (cancelled) return;
      if (list) setRemote({ userId, list });
      else setError("Couldn't load your addresses.");
    });
    return () => {
      cancelled = true;
    };
  }, [fetchList, userId]);

  const addresses: Address[] = !userId ? [] : isDemoMode ? demo[userId] ?? [] : remote?.userId === userId ? remote.list : [];
  const loading = Boolean(userId) && !isDemoMode && remote?.userId !== userId && !error;

  async function add(a: NewAddress): Promise<{ ok: boolean; error?: string }> {
    if (!userId) return { ok: false, error: "Sign in first." };
    if (addresses.length >= MAX_ADDRESSES) return { ok: false, error: `You can save up to ${MAX_ADDRESSES} addresses.` };
    const isDefault = addresses.length === 0;
    if (isDemoMode) {
      demoStore.set({ ...demoStore.getSnapshot(), [userId]: [...addresses, { ...a, id: crypto.randomUUID(), isDefault }] });
      return { ok: true };
    }
    const { error: e } = await getBrowserSupabase()!.from("addresses").insert({ user_id: userId, line1: a.line1, city: a.city, state: a.state, pin_code: a.pin, is_default: isDefault });
    if (e) return { ok: false, error: "Couldn't save that address." };
    await refresh();
    return { ok: true };
  }

  async function remove(id: string) {
    if (!userId) return;
    const wasDefault = addresses.find((x) => x.id === id)?.isDefault;
    if (isDemoMode) {
      const rest = addresses.filter((x) => x.id !== id);
      if (wasDefault && rest[0]) rest[0] = { ...rest[0], isDefault: true };
      demoStore.set({ ...demoStore.getSnapshot(), [userId]: rest });
      return;
    }
    const sb = getBrowserSupabase()!;
    await sb.from("addresses").delete().eq("id", id);
    const next = addresses.find((x) => x.id !== id);
    if (wasDefault && next) await sb.from("addresses").update({ is_default: true }).eq("id", next.id);
    await refresh();
  }

  async function makeDefault(id: string) {
    if (!userId) return;
    if (isDemoMode) {
      demoStore.set({ ...demoStore.getSnapshot(), [userId]: addresses.map((x) => ({ ...x, isDefault: x.id === id })) });
      return;
    }
    const sb = getBrowserSupabase()!;
    await sb.from("addresses").update({ is_default: false }).eq("user_id", userId);
    await sb.from("addresses").update({ is_default: true }).eq("id", id);
    await refresh();
  }

  return { addresses, loading, error, add, remove, makeDefault };
}
