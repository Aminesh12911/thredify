"use client";

import { useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/types";
import { adminApi } from "@/lib/admin/api";
import { STATUS_LABEL } from "@/lib/orders/store";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Modal } from "@/components/ui/Modal";
import { formatINR } from "@/lib/utils/format";
import { useAdminQuery, QueryState } from "./useAdminQuery";

const statuses = Object.keys(STATUS_LABEL) as OrderStatus[];
const load = () => adminApi.listOrders();
const field = "min-h-11 rounded-full border border-charcoal/25 bg-ivory px-4 text-sm";

export function OrdersAdmin() {
  const { data, loading, error, reload } = useAdminQuery(load);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((o) => (status === "all" || o.status === status) && (!term || `${o.code} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(term)));
  }, [data, q, status]);
  const open = data?.find((o) => o.code === openCode) ?? null;

  async function change(o: Order, next: OrderStatus) {
    const r = await adminApi.updateOrderStatus(o.code, next);
    setMsg(r.ok ? { ok: true, text: `${o.code} is now “${STATUS_LABEL[next]}”.` } : { ok: false, text: r.error });
    reload();
  }

  return (
    <div className="space-y-6">
      <div><p className="eyebrow">Sales</p><h1 className="mt-1 font-display text-4xl">Orders</h1></div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1"><label htmlFor="o-search" className="sr-only">Search orders</label><input id="o-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order ID, name or email…" className={`${field} w-full`} /></div>
        <div><label htmlFor="o-status" className="sr-only">Filter by status</label>
          <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value as "all" | OrderStatus)} className={`${field} w-full sm:w-auto`}>
            <option value="all">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select></div>
      </div>
      <p role={msg?.ok === false ? "alert" : "status"} className={`min-h-5 text-sm ${msg?.ok ? "text-olive" : "text-terracotta"}`}>{msg?.text}</p>

      <QueryState loading={loading} error={error}>
        {data && (rows.length === 0 ? (
          <div className="rounded-3xl bg-beige px-6 py-14 text-center"><h2 className="font-display text-2xl">{data.length === 0 ? "No orders yet" : "No orders match"}</h2><p className="mt-2 text-sm text-charcoal/70">{data.length === 0 ? "Orders will appear here as customers check out." : "Try a different search or status."}</p></div>
        ) : (
          <ul className="divide-y divide-charcoal/10 rounded-3xl bg-ivory px-5" aria-label="Orders">
            {rows.map((o) => (
              <li key={o.code} className="grid gap-3 py-4 md:grid-cols-[1.4fr_1fr_auto_auto] md:items-center" data-testid="order-row">
                <div>
                  <p className="font-medium">{o.code}</p>
                  <p className="text-xs text-charcoal/60">{o.customer.name} · {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                </div>
                <div className="text-sm">
                  <p className="tabular-nums">{formatINR(o.total)}</p>
                  <p className={`text-xs ${o.payment.status === "succeeded" ? "text-olive" : "text-terracotta"}`}>{o.payment.status === "succeeded" ? "Paid (simulated)" : "Payment failed"} · {o.payment.method}</p>
                </div>
                <div>
                  <label htmlFor={`st-${o.code}`} className="sr-only">Status for {o.code}</label>
                  <select id={`st-${o.code}`} value={o.status} onChange={(e) => change(o, e.target.value as OrderStatus)} className={`${field} w-full`}>
                    {statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setOpenCode(o.code)} aria-label={`View details for ${o.code}`} className="min-h-11 px-3 text-sm underline underline-offset-4">Details</button>
              </li>
            ))}
          </ul>
        ))}
      </QueryState>

      <Modal open={open !== null} onClose={() => setOpenCode(null)} label={open ? `Order ${open.code}` : "Order"} wide>
        {open && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl">Order {open.code}</h2>
              <p className="text-sm text-charcoal/70">{open.customer.name} · {open.customer.email} · {open.customer.phone}</p>
              <p className="text-xs text-charcoal/60">Placed {new Date(open.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <OrderTimeline status={open.status} />
            <OrderDetails order={open} />
          </div>
        )}
      </Modal>
    </div>
  );
}
