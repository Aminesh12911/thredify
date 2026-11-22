import type { Totals as TotalsType } from "@/lib/cart/pricing";
import { formatINR } from "@/lib/utils/format";

export function Totals({ totals }: { totals: TotalsType }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-olive">
          <dt>Discount ({totals.couponApplied})</dt>
          <dd className="tabular-nums">−{formatINR(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Shipping</dt>
        <dd className="tabular-nums">{totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}</dd>
      </div>
      <div className="flex justify-between border-t border-charcoal/15 pt-3 text-lg font-medium">
        <dt>Total</dt>
        <dd className="tabular-nums" data-testid="grand-total">{formatINR(totals.total)}</dd>
      </div>
    </dl>
  );
}
