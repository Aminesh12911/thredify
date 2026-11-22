"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAddresses } from "@/lib/auth/useAddresses";
import { useCoupon, couponActions } from "@/lib/cart/coupon";
import { computeTotals } from "@/lib/cart/pricing";
import { describeCustomization } from "@/lib/cart/describe";
import { useHydrated } from "@/lib/utils/localStore";
import { submitOrder } from "@/lib/orders/service";
import { scenarios, methods, type PaymentScenario } from "@/lib/checkout/gateway";
import {
  INDIAN_STATES, emptyCheckout, sampleCheckout, validateCheckout, type CheckoutField, type CheckoutValues,
} from "@/lib/checkout/validation";
import { CartLineImage } from "@/components/cart/CartLineImage";
import { Totals } from "@/components/cart/Totals";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils/format";

type Errors = Partial<Record<CheckoutField, string>>;

function Field({
  id, label, error, children,
}: { id: CheckoutField; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-terracotta">{error}</p>
      )}
    </div>
  );
}

const input = "min-h-11 w-full rounded-xl border border-charcoal/25 bg-ivory px-3 text-sm";

export function CheckoutClient() {
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useCart();
  const coupon = useCoupon();
  const totals = computeTotals(cart.items, coupon);
  const { user } = useAuth();
  const { addresses } = useAddresses(user?.id);
  const formRef = useRef<HTMLFormElement>(null);
  const placing = useRef(false); // guards against double-submit

  const [values, setValues] = useState<CheckoutValues>(emptyCheckout);
  const [errors, setErrors] = useState<Errors>({});
  const [method, setMethod] = useState<(typeof methods)[number]>("UPI");
  const [scenario, setScenario] = useState<PaymentScenario>("success");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  if (!hydrated) return <p role="status" className="py-24 text-center text-charcoal/60">Loading checkout…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="rounded-3xl bg-beige px-6 py-20 text-center">
        <h2 className="font-display text-3xl">Your cart is empty</h2>
        <p className="mt-3 text-charcoal/70">Add something before checking out.</p>
        <ButtonLink href="/shop" className="mt-8">Shop the collection</ButtonLink>
      </div>
    );
  }

  const set = (k: CheckoutField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const aria = (k: CheckoutField) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-error` : undefined });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (placing.current) return;
    setPayError("");
    const v = validateCheckout(values);
    if (!v.ok) {
      setErrors(v.errors);
      const first = (Object.keys(v.errors) as CheckoutField[])[0];
      formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }
    setErrors({});
    placing.current = true;
    setPaying(true);
    try {
      const result = await submitOrder({
        customer: { ...v.data },
        items: cart.items,
        couponCode: totals.couponApplied,
        totals,
        method,
        scenario,
      });
      if (!result.ok) {
        setPayError(result.error);
        return;
      }
      cart.clear();
      couponActions.set(null);
      router.push(`/order/${result.code}`);
    } catch {
      setPayError("Something went wrong placing your order. You have not been charged. Please try again.");
    } finally {
      placing.current = false;
      setPaying(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        <p className="rounded-2xl border border-terracotta/40 bg-ivory p-4 text-sm">
          <strong>Demo store — no real payments.</strong> Use fictional details only. This site never asks for card numbers, CVV or any payment credentials.
        </p>

        <fieldset className="space-y-4">
          <legend className="font-display text-2xl">Customer information</legend>
          {user ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const a = addresses.find((x) => x.isDefault) ?? addresses[0];
                setValues((v) => ({ ...v, name: user.name, email: user.email, phone: user.phone, ...(a ? { line1: a.line1, city: a.city, state: a.state, pin: a.pin } : {}) }));
                setErrors({});
              }}
            >
              Use my saved details
            </Button>
          ) : (
            <p className="text-sm text-charcoal/70">
              Checking out as a guest. <Link href="/account/login?next=/checkout" className="inline-flex min-h-11 items-center underline underline-offset-4">Log in</Link> to save this order to your account.
            </p>
          )}
          <Button type="button" variant="ghost" onClick={() => { setValues(sampleCheckout); setErrors({}); }}>
            Fill with sample test details
          </Button>
          <Field id="name" label="Full name" error={errors.name}>
            <input id="name" name="name" autoComplete="name" value={values.name} onChange={set("name")} className={input} {...aria("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="email" label="Email" error={errors.email}>
              <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} className={input} {...aria("email")} />
            </Field>
            <Field id="phone" label="Phone (10-digit mobile)" error={errors.phone}>
              <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={values.phone} onChange={set("phone")} className={input} {...aria("phone")} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-2xl">Delivery address</legend>
          <Field id="line1" label="Address" error={errors.line1}>
            <input id="line1" name="line1" autoComplete="street-address" value={values.line1} onChange={set("line1")} className={input} {...aria("line1")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="city" label="City" error={errors.city}>
              <input id="city" name="city" autoComplete="address-level2" value={values.city} onChange={set("city")} className={input} {...aria("city")} />
            </Field>
            <Field id="state" label="State" error={errors.state}>
              <select id="state" name="state" autoComplete="address-level1" value={values.state} onChange={set("state")} className={input} {...aria("state")}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field id="pin" label="PIN code" error={errors.pin}>
              <input id="pin" name="pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={values.pin} onChange={set("pin")} className={input} {...aria("pin")} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-2xl">Payment (sandbox)</legend>
          <div>
            <p className="text-sm font-medium">Payment method</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
              {methods.map((m) => (
                <label key={m} className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm ${method === m ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30"}`}>
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
                  {m}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-charcoal/60">Simulated only — nothing to enter here and nothing is stored.</p>
          </div>
          <div>
            <p className="text-sm font-medium">Test scenario</p>
            <div className="mt-2 space-y-2" role="radiogroup" aria-label="Test payment scenario">
              {scenarios.map((s) => (
                <label key={s.id} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${scenario === s.id ? "border-olive bg-cream" : "border-charcoal/15"}`}>
                  <input type="radio" name="scenario" value={s.id} checked={scenario === s.id} onChange={() => setScenario(s.id)} className="mt-1 accent-olive" />
                  <span><span className="font-medium">{s.label}</span><span className="block text-xs text-charcoal/60">{s.hint}</span></span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-3xl bg-ivory p-6 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="mt-4 space-y-4">
          {cart.items.map((i) => (
            <li key={i.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-sm">
              <div className="rounded-lg bg-beige p-1"><CartLineImage item={i} /></div>
              <div>
                <p className="font-medium">{i.name} × {i.quantity}</p>
                <p className="text-xs text-charcoal/60">Size {i.size} · {i.colorName}</p>
                {i.customization && <p className="text-xs text-charcoal/60">{describeCustomization(i.customization).join(" · ")}</p>}
              </div>
              <p className="tabular-nums">{formatINR(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-charcoal/10 pt-4"><Totals totals={totals} /></div>

        <p role="alert" className="mt-4 min-h-5 text-sm text-terracotta" data-testid="pay-error">{payError}</p>
        <Button type="submit" className="mt-2 w-full" disabled={paying} aria-busy={paying}>
          {paying ? "Processing test payment…" : `Pay ${formatINR(totals.total)} (test)`}
        </Button>
        <ButtonLink href="/cart" variant="ghost" className="mt-2 w-full">Back to cart</ButtonLink>
      </aside>
    </form>
  );
}
