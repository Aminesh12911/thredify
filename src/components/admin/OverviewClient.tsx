"use client";

import { useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin/api";
import { computeStats, LOW_STOCK } from "@/lib/admin/stats";
import { loadDemoData } from "@/lib/admin/demoData";
import { isDemoMode } from "@/lib/supabase/config";
import { STATUS_LABEL } from "@/lib/orders/store";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils/format";
import { useAdminQuery, QueryState } from "./useAdminQuery";

async function load() {
  const [products, orders] = await Promise.all([adminApi.listProducts(), adminApi.listOrders()]);
  return { products, orders };
}

function Tile({ label, value, hint, id }: { label: string; value: string; hint?: string; id: string }) {
  return (
    <div className="rounded-2xl bg-ivory p-5">
      <dt className="text-xs uppercase tracking-widest text-charcoal/60">{label}</dt>
      <dd data-testid={id} className="mt-2 font-display text-3xl tabular-nums">{value}</dd>
      {hint && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
    </div>
  );
}

export function OverviewClient() {
  const { data, loading, error, reload } = useAdminQuery(load);
  const [msg, setMsg] = useState("");

  return (
    <QueryState loading={loading} error={error}>
      {data && (() => {
        const s = computeStats(data.products, data.orders);
        const max = Math.max(1, ...Object.values(s.byStatus));
        const recent = data.orders.slice(0, 5);
        return (
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h1 className="mt-1 font-display text-4xl">Overview</h1>
              </div>
              {isDemoMode && (
                <div className="text-right">
                  <Button variant="secondary" onClick={() => { const r = loadDemoData(); setMsg(`Added ${r.orders} demo order(s) and ${r.enquiries} enquiry(ies).`); reload(); }}>
                    Load demo data
                  </Button>
                  <p role="status" className="mt-1 min-h-4 text-xs text-olive">{msg}</p>
                </div>
              )}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile id="stat-products" label="Total products" value={String(s.totalProducts)} />
              <Tile id="stat-orders" label="Total orders" value={String(s.totalOrders)} />
              <Tile id="stat-revenue" label="Demo revenue" value={formatINR(s.revenue)} hint="Paid, non-cancelled orders · simulated" />
              <Tile id="stat-pending" label="Pending orders" value={String(s.pending)} hint="Placed, processing or printing" />
            </dl>

            <div className="grid gap-6 lg:grid-cols-2">
              <section aria-labelledby="by-status" className="rounded-3xl bg-ivory p-6">
                <h2 id="by-status" className="font-display text-xl">Orders by status</h2>
                {s.totalOrders === 0 ? <p className="mt-4 text-sm text-charcoal/60">No orders yet.</p> : (
                  <ul className="mt-4 space-y-3">
                    {(["placed", "processing", "printing", "shipped", "delivered", "cancelled"] as const).map((k) => (
                      <li key={k} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
                        <span>{STATUS_LABEL[k]}</span>
                        <span className="h-2.5 rounded-full bg-beige"><span className="block h-full rounded-full bg-olive" style={{ width: `${((s.byStatus[k] ?? 0) / max) * 100}%` }} /></span>
                        <span className="text-right tabular-nums">{s.byStatus[k] ?? 0}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="inventory" className="rounded-3xl bg-ivory p-6">
                <h2 id="inventory" className="font-display text-xl">Inventory</h2>
                <p className="mt-2 text-sm"><strong data-testid="stat-units" className="tabular-nums">{s.totalUnits}</strong> units in stock · <strong data-testid="stat-out" className="tabular-nums">{s.outOfStock.length}</strong> sizes out of stock</p>
                {s.lowStock.length === 0 && s.outOfStock.length === 0 ? <p className="mt-4 text-sm text-charcoal/60">Everything is comfortably stocked.</p> : (
                  <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-sm" aria-label={`Low stock (${LOW_STOCK} or fewer)`}>
                    {s.outOfStock.map((o) => <li key={o.name + o.size} className="flex justify-between text-terracotta"><span>{o.name} · {o.size}</span><span>Out of stock</span></li>)}
                    {s.lowStock.map((l) => <li key={l.name + l.size} className="flex justify-between"><span>{l.name} · {l.size}</span><span className="tabular-nums">{l.stock} left</span></li>)}
                  </ul>
                )}
                <Link href="/admin/products" className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Manage stock</Link>
              </section>
            </div>

            <section aria-labelledby="recent" className="rounded-3xl bg-ivory p-6">
              <div className="flex items-center justify-between"><h2 id="recent" className="font-display text-xl">Recent orders</h2><Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">View all</Link></div>
              {recent.length === 0 ? <p className="mt-3 text-sm text-charcoal/60">No orders yet.{isDemoMode && " Use “Load demo data” to see the dashboard with sample orders."}</p> : (
                <ul className="mt-2 divide-y divide-charcoal/10">
                  {recent.map((o) => (
                    <li key={o.code} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span><span className="font-medium">{o.code}</span> <span className="text-charcoal/60">· {o.customer.name}</span></span>
                      <span className="tabular-nums">{formatINR(o.total)} <span className="ml-2 text-charcoal/60">{STATUS_LABEL[o.status]}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        );
      })()}
    </QueryState>
  );
}
