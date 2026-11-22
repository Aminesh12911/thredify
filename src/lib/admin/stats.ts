import type { Order, Size } from "@/types";

export const LOW_STOCK = 10;
export const PENDING_STATUSES = ["placed", "processing", "printing"] as const;

interface P {
  id: string;
  name: string;
  inventory: Record<Size, number>;
}

export interface Stats {
  totalProducts: number;
  totalOrders: number;
  revenue: number; // demo revenue: paid, non-cancelled orders
  pending: number;
  byStatus: Record<string, number>;
  totalUnits: number;
  outOfStock: { name: string; size: Size }[];
  lowStock: { name: string; size: Size; stock: number }[];
}

export function computeStats(products: P[], orders: Pick<Order, "status" | "total" | "payment">[]): Stats {
  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  const outOfStock: Stats["outOfStock"] = [];
  const lowStock: Stats["lowStock"] = [];
  let totalUnits = 0;
  for (const p of products) {
    for (const [size, stock] of Object.entries(p.inventory) as [Size, number][]) {
      totalUnits += stock;
      if (stock <= 0) outOfStock.push({ name: p.name, size });
      else if (stock <= LOW_STOCK) lowStock.push({ name: p.name, size, stock });
    }
  }
  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    revenue: orders.filter((o) => o.status !== "cancelled" && o.payment.status === "succeeded").reduce((n, o) => n + o.total, 0),
    pending: orders.filter((o) => (PENDING_STATUSES as readonly string[]).includes(o.status)).length,
    byStatus,
    totalUnits,
    outOfStock,
    lowStock: lowStock.sort((a, b) => a.stock - b.stock),
  };
}

export interface Customer {
  email: string;
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  lastOrder: string | null;
  hasAccount: boolean;
}

/** Customers = everyone who ordered (grouped by email) plus registered accounts with no orders yet. */
export function buildCustomers(
  orders: Pick<Order, "customer" | "total" | "status" | "createdAt" | "payment">[],
  accounts: { email: string; name: string; phone: string }[]
): Customer[] {
  const map = new Map<string, Customer>();
  const accountEmails = new Set(accounts.map((a) => a.email.toLowerCase()));
  for (const o of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const key = o.customer.email.toLowerCase();
    const prev = map.get(key);
    const counted = o.status !== "cancelled" && o.payment.status === "succeeded";
    map.set(key, {
      email: key,
      name: o.customer.name,
      phone: o.customer.phone,
      city: o.customer.city,
      orders: (prev?.orders ?? 0) + 1,
      spent: (prev?.spent ?? 0) + (counted ? o.total : 0),
      lastOrder: o.createdAt,
      hasAccount: accountEmails.has(key),
    });
  }
  for (const a of accounts) {
    const key = a.email.toLowerCase();
    if (!map.has(key)) map.set(key, { email: key, name: a.name, phone: a.phone, city: "", orders: 0, spent: 0, lastOrder: null, hasAccount: true });
  }
  return [...map.values()].sort((a, b) => (b.lastOrder ?? "").localeCompare(a.lastOrder ?? "") || a.name.localeCompare(b.name));
}
