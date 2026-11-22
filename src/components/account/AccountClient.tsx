"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAddresses, MAX_ADDRESSES } from "@/lib/auth/useAddresses";
import { useMyOrders } from "@/lib/orders/useMyOrders";
import { STATUS_LABEL } from "@/lib/orders/store";
import { INDIAN_STATES, checkoutSchema } from "@/lib/checkout/validation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils/format";

const input = "min-h-11 w-full rounded-xl border border-charcoal/25 bg-ivory px-3 text-sm";
const addressSchema = checkoutSchema.pick({ line1: true, city: true, state: true, pin: true });

function Card({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-3xl bg-ivory p-6">
      <h2 id={id} className="font-display text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await updateProfile({ name, phone });
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: "Profile saved." } : { ok: false, text: r.error });
  }

  return (
    <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="p-name" className="text-sm font-medium">Full name</label>
        <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={`${input} mt-1`} />
      </div>
      <div>
        <label htmlFor="p-email" className="text-sm font-medium">Email</label>
        <input id="p-email" value={user.email} readOnly aria-readonly="true" className={`${input} mt-1 bg-cream text-charcoal/70`} />
      </div>
      <div>
        <label htmlFor="p-phone" className="text-sm font-medium">Phone (optional)</label>
        <input id="p-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className={`${input} mt-1`} />
      </div>
      <div className="flex items-end gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
      </div>
      <p role={msg?.ok === false ? "alert" : "status"} className={`min-h-5 text-sm sm:col-span-2 ${msg?.ok ? "text-olive" : "text-terracotta"}`}>{msg?.text}</p>
    </form>
  );
}

function Addresses({ userId }: { userId: string }) {
  const { addresses, loading, error, add, remove, makeDefault } = useAddresses(userId);
  const [form, setForm] = useState({ line1: "", city: "", state: "", pin: "" });
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = addressSchema.safeParse(form);
    if (!v.success) return setMsg(v.error.issues[0]?.message ?? "Check the address.");
    const r = await add(v.data);
    if (!r.ok) return setMsg(r.error ?? "Couldn't save that address.");
    setForm({ line1: "", city: "", state: "", pin: "" });
    setMsg("");
    setOpen(false);
  }

  return (
    <div>
      {loading && <p role="status" className="text-sm text-charcoal/60">Loading addresses…</p>}
      {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
      {!loading && addresses.length === 0 && <p className="text-sm text-charcoal/70">No saved addresses yet.</p>}
      <ul className="space-y-3" aria-label="Saved addresses">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-charcoal/10 p-4 text-sm">
            <address className="not-italic">
              {a.line1}<br />{a.city}, {a.state} {a.pin}
              {a.isDefault && <span className="ml-2 rounded-full bg-olive px-2 py-0.5 text-[11px] text-ivory">Default</span>}
            </address>
            <div className="flex gap-1">
              {!a.isDefault && <button type="button" onClick={() => makeDefault(a.id)} className="min-h-11 px-3 underline underline-offset-4">Make default</button>}
              <button type="button" onClick={() => remove(a.id)} aria-label={`Delete address ${a.line1}`} className="min-h-11 px-3 text-terracotta underline underline-offset-4">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {!open && addresses.length < MAX_ADDRESSES && (
        <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>Add an address</Button>
      )}
      {open && (
        <form onSubmit={submit} noValidate className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="a-line1" className="text-sm font-medium">Address</label>
            <input id="a-line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className={`${input} mt-1`} autoComplete="street-address" />
          </div>
          <div>
            <label htmlFor="a-city" className="text-sm font-medium">City</label>
            <input id="a-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`${input} mt-1`} />
          </div>
          <div>
            <label htmlFor="a-state" className="text-sm font-medium">State</label>
            <select id="a-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={`${input} mt-1`}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="a-pin" className="text-sm font-medium">PIN code</label>
            <input id="a-pin" inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className={`${input} mt-1`} />
          </div>
          <p role="alert" className="min-h-5 text-sm text-terracotta sm:col-span-2">{msg}</p>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Save address</Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setMsg(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

function OrderHistory({ user }: { user: { id: string; email: string } }) {
  const { orders, loading, failed } = useMyOrders(user);
  if (loading) return <p role="status" className="text-sm text-charcoal/60">Loading your orders…</p>;
  if (failed) return <p role="alert" className="text-sm text-terracotta">We couldn&apos;t load your orders. Please refresh.</p>;
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-cream p-6 text-center text-sm">
        <p>No orders yet.</p>
        <ButtonLink href="/shop" className="mt-4">Start shopping</ButtonLink>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-charcoal/10" aria-label="Order history">
      {orders.map((o) => (
        <li key={o.code} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <div>
            <Link href={`/order/${o.code}`} className="font-medium underline underline-offset-4">{o.code}</Link>
            <p className="text-xs text-charcoal/60">
              {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
            </p>
          </div>
          <div className="text-right">
            <p className="tabular-nums">{formatINR(o.total)}</p>
            <p className="text-xs text-charcoal/60">{STATUS_LABEL[o.status]}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AccountClient() {
  const auth = useAuth();

  if (!auth.ready) return <p role="status" className="py-24 text-center text-charcoal/60">Loading your account…</p>;

  if (!auth.user) {
    return (
      <div className="rounded-3xl bg-beige px-6 py-16 text-center">
        <h2 className="font-display text-3xl">You&apos;re not signed in</h2>
        <p className="mx-auto mt-3 max-w-sm text-charcoal/70">Log in to see your orders and saved addresses, or create an account in a minute.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/account/login">Log in</ButtonLink>
          <ButtonLink href="/account/register" variant="secondary">Create account</ButtonLink>
        </div>
      </div>
    );
  }

  const { user } = auth;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-charcoal/70">Signed in as <strong>{user.email}</strong></p>
        <Button variant="secondary" onClick={() => auth.logout()}>Log out</Button>
      </div>
      <Card title="Profile" id="profile-h"><Profile key={user.id} /></Card>
      <Card title="Order history" id="orders-h"><OrderHistory user={user} /></Card>
      <Card title="Saved addresses" id="addresses-h"><Addresses userId={user.id} /></Card>
    </div>
  );
}
