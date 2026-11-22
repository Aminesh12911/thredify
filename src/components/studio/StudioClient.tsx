"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Customization, CustomizationLayer, Size } from "@/types";
import { SIZES } from "@/types";
import { TShirtMockup, inkFor } from "@/components/ui/TShirtMockup";
import { Button } from "@/components/ui/Button";
import { DesignLayers } from "./DesignLayers";
import { C } from "@/lib/products/seed";
import { studioFonts } from "@/lib/products/studioFonts";
import { customPrice, CUSTOM_BASE, PRINT_PER_SIDE, OVERSIZED_FEE } from "@/lib/products/customPricing";
import { processUpload } from "@/lib/utils/image";
import { useCart, MAX_QTY } from "@/lib/cart/store";
import { formatINR, cn } from "@/lib/utils/format";

const colors = Object.values(C);
const fits = ["Regular", "Oversized", "Slim"] as const;
const inkSwatches = ["#252820", "#F3EFE6", "#667052", "#B87958", "#FFFDF8", "#C0392B", "#1F4E79"];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-charcoal/10 bg-ivory p-5" aria-labelledby={`sec-${n}`}>
      <h2 id={`sec-${n}`} className="flex items-center gap-3 font-display text-lg">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-charcoal text-xs text-ivory">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StudioClient() {
  const cart = useCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState(colors[0]);
  const [fit, setFit] = useState<Customization["fit"]>("Regular");
  const [size, setSize] = useState<Size | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [layers, setLayers] = useState<CustomizationLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [uploadError, setUploadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const sideLayers = layers.filter((l) => l.side === side);
  const selected = layers.find((l) => l.id === selectedId && l.side === side) ?? null;
  const price = useMemo(() => customPrice({ fit, layers }), [fit, layers]);
  const count = (s: "front" | "back") => layers.filter((l) => l.side === s).length;

  const update = (id: string, patch: Partial<CustomizationLayer>) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const remove = (id: string) => {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  };
  const addLayer = (layer: Omit<CustomizationLayer, "id" | "side" | "x" | "y" | "scale">) => {
    const id = crypto.randomUUID();
    setLayers((ls) => [...ls, { id, side, x: 50, y: 50, scale: 1, ...layer }]);
    setSelectedId(id);
    setMessage(null);
  };

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    setBusy(true);
    try {
      const { dataUrl, aspect } = await processUpload(file);
      addLayer({ kind: "image", imageDataUrl: dataUrl, aspect });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try another image.");
    } finally {
      setBusy(false);
    }
  }

  function addText() {
    addLayer({ kind: "text", text: "Your text", font: studioFonts[0].id, fontSize: 22, color: inkFor(color.hex) });
  }

  function reset() {
    setColor(colors[0]);
    setFit("Regular");
    setSize(null);
    setSide("front");
    setLayers([]);
    setSelectedId(null);
    setQty(1);
    setUploadError("");
    setMessage(null);
  }

  function addToCart() {
    if (layers.length === 0) {
      setMessage({ kind: "error", text: "Add some artwork or text before adding to cart." });
      return;
    }
    if (!size) {
      setMessage({ kind: "error", text: "Please choose a size." });
      return;
    }
    cart.add({
      productId: null,
      name: "Custom T-shirt",
      unitPrice: price.total,
      quantity: qty,
      size,
      colorName: color.name,
      colorHex: color.hex,
      customization: { tshirtColor: color, fit, layers },
    });
    setMessage({ kind: "ok", text: "Your custom T-shirt was added to the cart." });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* Live preview */}
      <div className="sticky top-16 z-10 bg-cream py-2 lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-beige p-3 sm:p-6">
          <TShirtMockup
            color={color.hex}
            fit={fit}
            side={side}
            className="mx-auto h-[30vh] w-auto max-w-full touch-pan-y sm:h-[44vh] lg:h-[64vh]"
          >
            <DesignLayers
              layers={sideLayers}
              selectedId={selected?.id}
              showGuides
              onSelect={setSelectedId}
              onChange={update}
              onRemove={remove}
            />
          </TShirtMockup>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label="Print side" className="inline-flex rounded-full border border-charcoal/25 p-1">
              {(["front", "back"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={side === s}
                  onClick={() => {
                    setSide(s);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "min-h-10 rounded-full px-4 text-sm capitalize transition-colors",
                    side === s ? "bg-charcoal text-ivory" : "hover:bg-cream"
                  )}
                >
                  {s} ({count(s)})
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={reset} aria-label="Reset design" className="px-3 sm:px-6">
              Reset<span className="hidden sm:inline">&nbsp;design</span>
            </Button>
          </div>
          <p className="mt-1 hidden text-xs text-charcoal/60 sm:block">Dashed line = print area. Drag a layer, or focus it and use arrow keys.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <Section n={1} title="Choose your T-shirt">
          <fieldset>
            <legend className="text-sm font-medium">
              Colour: <span className="font-normal text-charcoal/70">{color.name}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={c.name === color.name}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-11 w-11 rounded-full border-2",
                    c.name === color.name ? "border-charcoal ring-2 ring-olive ring-offset-2 ring-offset-ivory" : "border-charcoal/20"
                  )}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Fit</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {fits.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={fit === f}
                  onClick={() => setFit(f)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm",
                    fit === f ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30"
                  )}
                >
                  {f}
                  {f === "Oversized" ? ` (+${formatINR(OVERSIZED_FEE)})` : ""}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Size</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-h-11 min-w-12 rounded-full border px-4 text-sm",
                    size === s ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section n={2} title={`Add artwork to the ${side}`}>
          <div className="flex flex-wrap gap-3">
            <input ref={fileRef} id="art-upload" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="sr-only" onChange={onFile} />
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "Processing…" : "Upload image"}
            </Button>
            <Button variant="secondary" onClick={addText}>
              Add text
            </Button>
          </div>
          <p className="mt-2 text-xs text-charcoal/60">PNG, JPG or JPEG, up to 5 MB. Large images are resized to keep your design light.</p>
          {uploadError && (
            <p role="alert" className="mt-2 text-sm text-terracotta">
              {uploadError}
            </p>
          )}

          {sideLayers.length > 0 ? (
            <ul className="mt-4 space-y-2" aria-label={`Layers on the ${side}`}>
              {sideLayers.map((l, i) => (
                <li key={l.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    aria-pressed={l.id === selected?.id}
                    className={cn(
                      "min-h-11 flex-1 truncate rounded-xl border px-3 text-left text-sm",
                      l.id === selected?.id ? "border-olive bg-cream" : "border-charcoal/15"
                    )}
                  >
                    {l.kind === "image" ? `Image ${i + 1}` : `Text: ${l.text || "(empty)"}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    aria-label={`Delete layer ${i + 1}`}
                    className="min-h-11 min-w-11 rounded-xl text-sm text-terracotta hover:bg-cream"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-charcoal/70">Nothing on the {side} yet. Upload an image or add text to begin.</p>
          )}
        </Section>

        {selected && (
          <Section n={3} title={selected.kind === "image" ? "Edit image" : "Edit text"}>
            {selected.kind === "text" ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="txt" className="text-sm font-medium">Text</label>
                  <input
                    id="txt"
                    value={selected.text ?? ""}
                    maxLength={30}
                    onChange={(e) => update(selected.id, { text: e.target.value })}
                    className="mt-1 min-h-11 w-full rounded-xl border border-charcoal/25 bg-cream px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="font" className="text-sm font-medium">Font</label>
                  <select
                    id="font"
                    value={selected.font}
                    onChange={(e) => update(selected.id, { font: e.target.value })}
                    className="mt-1 min-h-11 w-full rounded-xl border border-charcoal/25 bg-cream px-3 text-sm"
                  >
                    {studioFonts.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fsize" className="text-sm font-medium">Text size: {selected.fontSize}</label>
                  <input
                    id="fsize"
                    type="range"
                    min={10}
                    max={48}
                    value={selected.fontSize}
                    onChange={(e) => update(selected.id, { fontSize: Number(e.target.value) })}
                    className="mt-1 h-11 w-full accent-olive"
                  />
                </div>
                <fieldset>
                  <legend className="text-sm font-medium">Text colour</legend>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {inkSwatches.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Text colour ${c}`}
                        aria-pressed={selected.color?.toLowerCase() === c.toLowerCase()}
                        onClick={() => update(selected.id, { color: c })}
                        className={cn("h-11 w-11 rounded-full border-2", selected.color?.toLowerCase() === c.toLowerCase() ? "border-charcoal" : "border-charcoal/20")}
                        style={{ background: c }}
                      />
                    ))}
                    <label className="ml-1 flex items-center gap-1 text-xs text-charcoal/70">
                      <span>Custom</span>
                      <input
                        type="color"
                        value={selected.color ?? "#252820"}
                        onChange={(e) => update(selected.id, { color: e.target.value })}
                        className="h-11 w-11 cursor-pointer rounded-full border-0 bg-transparent p-0"
                      />
                    </label>
                  </div>
                </fieldset>
              </div>
            ) : (
              <div>
                <label htmlFor="iscale" className="text-sm font-medium">Size: {Math.round(selected.scale * 100)}%</label>
                <input
                  id="iscale"
                  type="range"
                  min={20}
                  max={200}
                  value={Math.round(selected.scale * 100)}
                  onChange={(e) => update(selected.id, { scale: Number(e.target.value) / 100 })}
                  className="mt-1 h-11 w-full accent-olive"
                />
                {selected.scale > 1.6 && (
                  <p className="mt-1 text-xs text-terracotta">Parts of the image outside the dashed print area will not be printed.</p>
                )}
              </div>
            )}
            <Button variant="ghost" className="mt-3" onClick={() => update(selected.id, { x: 50, y: 50 })}>
              Centre in print area
            </Button>
          </Section>
        )}

        <Section n={selected ? 4 : 3} title="Price & add to cart">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Custom T-shirt ({fit})</dt><dd className="tabular-nums">{formatINR(CUSTOM_BASE)}</dd></div>
            <div className="flex justify-between"><dt>Printing ({price.sides} side{price.sides === 1 ? "" : "s"} × {formatINR(PRINT_PER_SIDE)})</dt><dd className="tabular-nums">{formatINR(price.printing)}</dd></div>
            {price.fitFee > 0 && (
              <div className="flex justify-between"><dt>Oversized fit</dt><dd className="tabular-nums">{formatINR(price.fitFee)}</dd></div>
            )}
            <div className="flex justify-between border-t border-charcoal/15 pt-2 text-base font-medium"><dt>Per T-shirt</dt><dd className="tabular-nums">{formatINR(price.total)}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-charcoal/30" role="group" aria-label="Quantity">
              <button type="button" className="min-h-11 min-w-11 text-lg disabled:opacity-40" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>−</button>
              <span className="min-w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
              <button type="button" className="min-h-11 min-w-11 text-lg disabled:opacity-40" aria-label="Increase quantity" disabled={qty >= MAX_QTY} onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <Button onClick={addToCart} className="flex-1 basis-44 whitespace-nowrap">Add to cart · {formatINR(price.total * qty)}</Button>
          </div>
          <p
            role={message?.kind === "error" ? "alert" : "status"}
            className={cn("mt-3 min-h-5 text-sm", message?.kind === "error" ? "text-terracotta" : "text-olive")}
          >
            {message?.text}
            {message?.kind === "ok" && (
              <>
                {" "}
                <Link href="/cart" className="underline underline-offset-4">View cart</Link>
              </>
            )}
          </p>
        </Section>
      </div>
    </div>
  );
}
