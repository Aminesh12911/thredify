"use client";

import type { CartItem, Order, OrderStatus } from "@/types";
import { seedProducts } from "@/lib/products/seed";
import { computeTotals } from "@/lib/cart/pricing";
import { importOrders } from "@/lib/orders/store";
import { demoEnquiries, type Enquiry } from "@/lib/enquiries/service";

/** Fictional customers, orders and enquiries so the admin dashboard can be demonstrated. Demo mode only. */
const people = [
  ["Meera Iyer", "meera.demo", "Bengaluru", "Karnataka", "560001"],
  ["Rohan Mehta", "rohan.demo", "Mumbai", "Maharashtra", "400001"],
  ["Sana Khan", "sana.demo", "Delhi", "Delhi", "110001"],
  ["Arjun Nair", "arjun.demo", "Kochi", "Kerala", "682001"],
  ["Ishita Das", "ishita.demo", "Kolkata", "West Bengal", "700001"],
  ["Kabir Singh", "kabir.demo", "Jaipur", "Rajasthan", "302001"],
] as const;

const line = (slug: string, size: CartItem["size"], qty: number, i: number): CartItem => {
  const p = seedProducts.find((x) => x.slug === slug)!;
  return { id: `demo-line-${i}-${slug}`, productId: p.id, name: p.name, unitPrice: p.price, quantity: qty, size, colorName: p.colors[0].name, colorHex: p.colors[0].hex, slogan: p.slogan };
};

const custom = (i: number): CartItem => ({
  id: `demo-line-${i}-custom`, productId: null, name: "Custom T-shirt", unitPrice: 649, quantity: 2, size: "L", colorName: "Olive", colorHex: "#667052",
  customization: { tshirtColor: { name: "Olive", hex: "#667052" }, fit: "Regular", layers: [{ id: "t1", kind: "text", side: "front", x: 50, y: 45, scale: 1, text: "Society Fest 2026", font: "fraunces", fontSize: 20, color: "#F3EFE6" }] },
});

const plan: Array<{ who: number; items: (i: number) => CartItem[]; status: OrderStatus; ago: number; coupon?: string }> = [
  { who: 0, items: (i) => [line("the-quiet-type", "M", 1, i), line("grounded", "M", 1, i)], status: "delivered", ago: 12 },
  { who: 1, items: (i) => [custom(i)], status: "printing", ago: 3 },
  { who: 2, items: (i) => [line("unfiltered", "S", 1, i)], status: "shipped", ago: 5, coupon: "WELCOME10" },
  { who: 3, items: (i) => [line("everyday-essential", "XL", 3, i)], status: "placed", ago: 0 },
  { who: 4, items: (i) => [line("slow-living", "M", 1, i)], status: "cancelled", ago: 8 },
  { who: 0, items: (i) => [line("off-script", "L", 1, i)], status: "processing", ago: 1 },
  { who: 5, items: (i) => [line("grounded", "L", 2, i), line("slow-living", "L", 1, i)], status: "delivered", ago: 20 },
];

export function loadDemoData() {
  const orders: Order[] = plan.map((p, i) => {
    const [name, user, city, state, pin] = people[p.who];
    const items = p.items(i);
    const t = computeTotals(items, p.coupon ?? null);
    return {
      code: `THR-20261001-DEMO${i + 1}`,
      createdAt: new Date(Date.now() - p.ago * 86_400_000 - i * 3_600_000).toISOString(),
      customer: { name, email: `${user}@example.com`, phone: `98765432${10 + i}`, line1: `${10 + i} Demo Street, Sample Nagar`, city, state, pin },
      items, subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total, couponCode: t.couponApplied,
      payment: { status: "succeeded", provider: "sandbox-simulator", reference: `SBX-DEMO${i + 1}000`, method: ["UPI", "Card", "Net banking"][i % 3] },
      status: p.status,
    };
  });
  const addedOrders = importOrders(orders);

  const enq = (n: number, e: Omit<Enquiry, "id" | "createdAt">, ago: number): Enquiry => ({ id: `demo-enq-${n}`, createdAt: new Date(Date.now() - ago * 86_400_000).toISOString(), ...e });
  const seeds: Enquiry[] = [
    enq(1, { name: "Meera Iyer", email: "meera.demo@example.com", subject: "Bulk order for our college fest", message: "We need about 80 T-shirts with our fest logo on the front and sponsor names on the back. Do you offer a bulk discount, and what is the lead time?", kind: "custom_design", status: "new" }, 1),
    enq(2, { name: "Dev Patel", email: "dev.demo@example.com", subject: "Print quality on dark colours", message: "Will a white-ink print show up well on the Charcoal T-shirt? I'd like to see a sample before ordering ten.", kind: "custom_design", status: "in_progress" }, 4),
    enq(3, { name: "Sana Khan", email: "sana.demo@example.com", subject: "Where is my order?", message: "I placed an order last week and the status still says shipped. Could you check when it will arrive?", kind: "contact", status: "new" }, 2),
    enq(4, { name: "Tara Joshi", email: "tara.demo@example.com", subject: "Size guide question", message: "I'm between M and L in the Oversized fit. Which would you recommend for a relaxed look?", kind: "contact", status: "closed" }, 9),
  ];
  const have = new Set(demoEnquiries.getSnapshot().map((e) => e.id));
  const fresh = seeds.filter((s) => !have.has(s.id));
  if (fresh.length) demoEnquiries.set([...fresh, ...demoEnquiries.getSnapshot()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  return { orders: addedOrders, enquiries: fresh.length };
}
