"use client";

import { useState } from "react";
import { adminApi, productInputSchema, slugify, STYLES, COLOR_NAMES, type AdminProduct } from "@/lib/admin/api";
import { STUDIO_COLORS } from "@/lib/products/studioColors";
import { SIZES, type Size } from "@/types";
import { LOW_STOCK } from "@/lib/admin/stats";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatINR } from "@/lib/utils/format";
import { useAdminQuery, QueryState } from "./useAdminQuery";

const input = "min-h-11 w-full rounded-xl border border-charcoal/25 bg-ivory px-3 text-sm";
const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

interface Form {
  name: string; slug: string; price: string; category: string; style: string; description: string; slogan: string;
  colors: string[]; featured: boolean; inventory: Record<Size, string>;
}
const blank: Form = { name: "", slug: "", price: "", category: "", style: "Minimal", description: "", slogan: "", colors: [], featured: false, inventory: { S: "0", M: "0", L: "0", XL: "0", XXL: "0" } };
const fromProduct = (p: AdminProduct): Form => ({
  name: p.name, slug: p.slug, price: String(p.price), category: p.category, style: p.style, description: p.description, slogan: p.slogan,
  colors: p.colors.map((c) => c.name), featured: p.featured,
  inventory: Object.fromEntries(SIZES.map((s) => [s, String(p.inventory[s])])) as Record<Size, string>,
});

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} role="alert" className="mt-1 text-xs text-terracotta">{msg}</p> : null;
}

function ProductForm({ product, categories, onDone, onCancel }: { product: AdminProduct | null; categories: string[]; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState<Form>(product ? fromProduct(product) : blank);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = productInputSchema.safeParse({
      ...f, price: num(f.price),
      inventory: Object.fromEntries(SIZES.map((s) => [s, num(f.inventory[s])])),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) { const k = i.path[0] === "inventory" ? `stock-${String(i.path[1] ?? "")}` : String(i.path[0]); errs[k] ??= i.message; }
      setErrors(errs);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({}); setFormError(""); setBusy(true);
    const r = await adminApi.saveProduct(parsed.data, product?.id);
    setBusy(false);
    if (!r.ok) return setFormError(r.error);
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <h2 className="font-display text-2xl sm:col-span-2">{product ? `Edit ${product.name}` : "Add a product"}</h2>
      <div>
        <label htmlFor="pf-name" className="text-sm font-medium">Name</label>
        <input id="pf-name" className={`${input} mt-1`} value={f.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "e-name" : undefined}
          onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
        <Err id="e-name" msg={errors.name} />
      </div>
      <div>
        <label htmlFor="pf-slug" className="text-sm font-medium">URL slug</label>
        <input id="pf-slug" className={`${input} mt-1`} value={f.slug} aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "e-slug" : undefined}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
        <Err id="e-slug" msg={errors.slug} />
      </div>
      <div>
        <label htmlFor="pf-price" className="text-sm font-medium">Price (₹)</label>
        <input id="pf-price" inputMode="numeric" className={`${input} mt-1`} value={f.price} aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? "e-price" : undefined} onChange={(e) => set("price", e.target.value)} />
        <Err id="e-price" msg={errors.price} />
      </div>
      <div>
        <label htmlFor="pf-style" className="text-sm font-medium">Style</label>
        <select id="pf-style" className={`${input} mt-1`} value={f.style} onChange={(e) => set("style", e.target.value)}>{STYLES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div>
        <label htmlFor="pf-cat" className="text-sm font-medium">Category</label>
        <input id="pf-cat" list="pf-cats" className={`${input} mt-1`} value={f.category} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? "e-cat" : undefined} onChange={(e) => set("category", e.target.value)} />
        <datalist id="pf-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        <Err id="e-cat" msg={errors.category} />
      </div>
      <div>
        <label htmlFor="pf-slogan" className="text-sm font-medium">Printed slogan</label>
        <input id="pf-slogan" className={`${input} mt-1`} value={f.slogan} aria-invalid={Boolean(errors.slogan)} aria-describedby={errors.slogan ? "e-slogan" : undefined} onChange={(e) => set("slogan", e.target.value)} />
        <Err id="e-slogan" msg={errors.slogan} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pf-desc" className="text-sm font-medium">Description</label>
        <textarea id="pf-desc" rows={3} className={`${input} mt-1 py-2`} value={f.description} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "e-desc" : undefined} onChange={(e) => set("description", e.target.value)} />
        <Err id="e-desc" msg={errors.description} />
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">Colours</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLOR_NAMES.map((c) => {
            const on = f.colors.includes(c);
            return (
              <label key={c} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${on ? "border-charcoal bg-cream" : "border-charcoal/25"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => set("colors", on ? f.colors.filter((x) => x !== c) : [...f.colors, c])} />
                <span className="h-4 w-4 rounded-full border border-charcoal/30" style={{ background: STUDIO_COLORS[c] }} aria-hidden="true" />{c}{on && <span aria-hidden="true">✓</span>}
              </label>
            );
          })}
        </div>
        <Err id="e-colors" msg={errors.colors} />
      </fieldset>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">Stock by size</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {SIZES.map((s) => (
            <div key={s}>
              <label htmlFor={`pf-stock-${s}`} className="text-xs text-charcoal/60">{s}</label>
              <input id={`pf-stock-${s}`} inputMode="numeric" className={`${input} px-2 text-center`} value={f.inventory[s]} aria-invalid={Boolean(errors[`stock-${s}`])} onChange={(e) => set("inventory", { ...f.inventory, [s]: e.target.value })} />
            </div>
          ))}
        </div>
        {Object.entries(errors).filter(([k]) => k.startsWith("stock-")).slice(0, 1).map(([k, m]) => <Err key={k} id="e-stock" msg={m} />)}
      </fieldset>
      <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
        <input type="checkbox" className="h-5 w-5 accent-olive" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured on the homepage
      </label>
      <p role="alert" className="min-h-5 text-sm text-terracotta sm:col-span-2">{formError}</p>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : product ? "Save changes" : "Add product"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

const load = () => adminApi.listProducts();

export function ProductsAdmin() {
  const { data, loading, error, reload } = useAdminQuery(load);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function remove(p: AdminProduct) {
    const r = await adminApi.deleteProduct(p.id);
    setConfirmId(null);
    setMsg(r.ok ? { ok: true, text: `Deleted “${p.name}”.` } : { ok: false, text: r.error });
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Catalogue</p><h1 className="mt-1 font-display text-4xl">Products</h1></div>
        <Button onClick={() => setEditing("new")}>Add product</Button>
      </div>
      <p role={msg?.ok === false ? "alert" : "status"} className={`min-h-5 text-sm ${msg?.ok ? "text-olive" : "text-terracotta"}`}>{msg?.text}</p>

      <QueryState loading={loading} error={error}>
        {data && (data.length === 0 ? (
          <div className="rounded-3xl bg-beige px-6 py-14 text-center"><h2 className="font-display text-2xl">No products yet</h2><p className="mt-2 text-sm text-charcoal/70">Add your first product to start selling.</p></div>
        ) : (
          <ul className="divide-y divide-charcoal/10 rounded-3xl bg-ivory px-5" aria-label="Products">
            {data.map((p) => {
              const low = SIZES.filter((s) => p.inventory[s] <= LOW_STOCK);
              return (
                <li key={p.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center" data-testid="product-row">
                  <div>
                    <p className="font-medium">{p.name}{p.featured && <span className="ml-2 rounded-full bg-olive px-2 py-0.5 text-[11px] text-ivory">Featured</span>}</p>
                    <p className="text-xs text-charcoal/60">/{p.slug} · {p.category} · {p.style}</p>
                    {low.length > 0 && <p className="mt-1 text-xs text-terracotta">Low/out: {low.map((s) => `${s} (${p.inventory[s]})`).join(", ")}</p>}
                  </div>
                  <div className="text-sm tabular-nums sm:text-right"><p>{formatINR(p.price)}</p><p className="text-xs text-charcoal/60">{p.stock} in stock</p></div>
                  <div className="flex items-center gap-1">
                    {confirmId === p.id ? (
                      <>
                        <span className="text-sm">Delete?</span>
                        <button type="button" onClick={() => remove(p)} className="min-h-11 px-3 text-sm font-medium text-terracotta underline underline-offset-4">Yes, delete</button>
                        <button type="button" onClick={() => setConfirmId(null)} className="min-h-11 px-3 text-sm underline underline-offset-4">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} className="min-h-11 px-3 text-sm underline underline-offset-4">Edit</button>
                        <button type="button" onClick={() => setConfirmId(p.id)} aria-label={`Delete ${p.name}`} className="min-h-11 px-3 text-sm text-terracotta underline underline-offset-4">Delete</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
      </QueryState>

      <Modal open={editing !== null} onClose={() => setEditing(null)} label={editing === "new" ? "Add a product" : "Edit product"} wide>
        {editing !== null && (
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            product={editing === "new" ? null : editing}
            categories={[...new Set((data ?? []).map((p) => p.category))]}
            onCancel={() => setEditing(null)}
            onDone={() => { setMsg({ ok: true, text: editing === "new" ? "Product added." : "Product saved." }); setEditing(null); reload(); }}
          />
        )}
      </Modal>
    </div>
  );
}
