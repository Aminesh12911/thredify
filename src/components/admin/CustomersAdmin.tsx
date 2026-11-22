"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { buildCustomers } from "@/lib/admin/stats";
import { formatINR } from "@/lib/utils/format";
import { useAdminQuery, QueryState } from "./useAdminQuery";

async function load() {
  const [orders, accounts] = await Promise.all([adminApi.listOrders(), adminApi.listAccounts()]);
  return buildCustomers(orders, accounts);
}

export function CustomersAdmin() {
  const { data, loading, error } = useAdminQuery(load);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((c) => !t || `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(t));
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div><p className="eyebrow">People</p><h1 className="mt-1 font-display text-4xl">Customers</h1></div>
      <div><label htmlFor="c-search" className="sr-only">Search customers</label><input id="c-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or city…" className="min-h-11 w-full max-w-md rounded-full border border-charcoal/25 bg-ivory px-4 text-sm" /></div>
      <QueryState loading={loading} error={error}>
        {data && (rows.length === 0 ? (
          <div className="rounded-3xl bg-beige px-6 py-14 text-center"><h2 className="font-display text-2xl">{data.length === 0 ? "No customers yet" : "No customers match"}</h2><p className="mt-2 text-sm text-charcoal/70">Customers appear once they place an order or create an account.</p></div>
        ) : (
          <ul className="divide-y divide-charcoal/10 rounded-3xl bg-ivory px-5" aria-label="Customers">
            {rows.map((c) => (
              <li key={c.email} className="grid gap-2 py-4 md:grid-cols-[1.5fr_1fr_auto] md:items-center" data-testid="customer-row">
                <div>
                  <p className="font-medium">{c.name || "(no name)"}{c.hasAccount && <span className="ml-2 rounded-full bg-olive px-2 py-0.5 text-[11px] text-ivory">Account</span>}</p>
                  <p className="text-xs text-charcoal/60">{c.email}{c.phone && ` · ${c.phone}`}{c.city && ` · ${c.city}`}</p>
                </div>
                <p className="text-sm text-charcoal/70">{c.lastOrder ? `Last order ${new Date(c.lastOrder).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "No orders yet"}</p>
                <p className="text-sm tabular-nums md:text-right">{c.orders} order{c.orders === 1 ? "" : "s"} · {formatINR(c.spent)}</p>
              </li>
            ))}
          </ul>
        ))}
      </QueryState>
    </div>
  );
}
