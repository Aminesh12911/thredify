import type { Order } from "@/types";
import { CartLineImage } from "@/components/cart/CartLineImage";
import { describeCustomization } from "@/lib/cart/describe";
import { Totals } from "@/components/cart/Totals";
import { formatINR } from "@/lib/utils/format";

export function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <h2 className="font-display text-2xl">Items</h2>
        <ul className="mt-4 divide-y divide-charcoal/10 border-y border-charcoal/10">
          {order.items.map((i) => (
            <li key={i.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 py-4 text-sm">
              <div className="rounded-xl bg-beige p-1.5"><CartLineImage item={i} /></div>
              <div>
                <p className="font-medium">{i.name} × {i.quantity}</p>
                <p className="text-xs text-charcoal/60">Size {i.size} · {i.colorName}</p>
                {i.customization && (
                  <p className="text-xs text-charcoal/60">{describeCustomization(i.customization).join(" · ")}</p>
                )}
              </div>
              <p className="tabular-nums">{formatINR(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        {order.imagesStripped && (
          <p className="mt-3 rounded-xl bg-beige p-3 text-xs">
            Demo note: your uploaded artwork was too large to keep in this browser&apos;s storage, so only its details are saved here.
          </p>
        )}
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl bg-ivory p-5" aria-label="Totals">
          <Totals totals={{ subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, total: order.total, couponApplied: order.couponCode, couponNote: null }} />
        </section>
        <section className="rounded-2xl bg-ivory p-5 text-sm" aria-label="Payment">
          <h3 className="font-display text-lg">Payment</h3>
          <p className="mt-2">
            Status:{" "}
            <strong className={order.payment.status === "succeeded" ? "text-olive" : "text-terracotta"}>
              {order.payment.status === "succeeded" ? "Paid (simulated)" : "Failed"}
            </strong>
          </p>
          <p className="text-charcoal/70">Method: {order.payment.method} · Sandbox simulator</p>
          <p className="text-xs text-charcoal/50">Test reference {order.payment.reference}. No real money was charged.</p>
        </section>
        <section className="rounded-2xl bg-ivory p-5 text-sm" aria-label="Delivery address">
          <h3 className="font-display text-lg">Delivering to</h3>
          <address className="mt-2 not-italic text-charcoal/70">
            {order.customer.name}<br />
            {order.customer.line1}<br />
            {order.customer.city}, {order.customer.state} {order.customer.pin}
          </address>
        </section>
      </div>
    </div>
  );
}
