import type { Order } from "@/types";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/orders/store";
import { cn } from "@/lib/utils/format";

export function OrderTimeline({ status }: { status: Order["status"] }) {
  if (status === "cancelled") {
    return <p className="rounded-xl bg-beige p-3 text-sm">This order was cancelled.</p>;
  }
  const current = STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid gap-3 sm:grid-cols-5" aria-label="Order progress">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} aria-current={i === current ? "step" : undefined} className="flex items-center gap-3 sm:flex-col sm:items-start">
            <span
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs",
                done ? "border-olive bg-olive text-ivory" : "border-charcoal/30 text-charcoal/50"
              )}
              aria-hidden="true"
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={cn("text-sm", done ? "font-medium" : "text-charcoal/50")}>
              {STATUS_LABEL[s]}
              {i === current && <span className="sr-only"> (current)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
