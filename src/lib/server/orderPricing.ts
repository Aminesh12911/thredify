import { z } from "zod";
import type { CartItem, Customization, Product } from "@/types";
import { computeTotals, type Totals } from "@/lib/cart/pricing";
import { customPrice } from "@/lib/products/customPricing";
import { checkoutSchema } from "@/lib/checkout/validation";
import { studioFonts } from "@/lib/products/studioFonts";
import { STUDIO_COLORS } from "@/lib/products/studioColors";

/**
 * Authoritative order pricing. The browser sends WHAT it wants (product id, size, colour,
 * quantity, design); this module decides what it costs. Client-sent prices are never read.
 * Pure (no I/O) so it can be unit-tested; the API route supplies the catalogue.
 */

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const MAX_IMAGE_CHARS = 1_500_000; // ~1.1 MB of base64 per image
const IMAGE_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const fontIds = studioFonts.map((f) => f.id);

const layerSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(["text", "image"]),
  side: z.enum(["front", "back"]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  scale: z.number().min(0.2).max(2),
  text: z.string().max(30).optional(),
  font: z.string().refine((f) => fontIds.includes(f), "Unknown font.").optional(),
  fontSize: z.number().min(10).max(48).optional(),
  color: z.string().regex(HEX).optional(),
  imageDataUrl: z.string().max(MAX_IMAGE_CHARS).regex(IMAGE_URL, "Only PNG and JPEG images are allowed.").optional(),
  aspect: z.number().min(0.05).max(20).optional(),
});

const customizationSchema = z.object({
  tshirtColor: z.object({ name: z.string() }),
  fit: z.enum(["Regular", "Oversized", "Slim"]),
  layers: z.array(layerSchema).min(1, "A custom design needs at least one layer.").max(12),
});

const itemSchema = z.object({
  productId: z.string().max(64).nullable(),
  size: z.enum(SIZES),
  colorName: z.string().max(40),
  quantity: z.number().int().min(1).max(10),
  customization: customizationSchema.optional(),
});

export const orderRequestSchema = z.object({
  items: z.array(itemSchema).min(1, "Your cart is empty.").max(20),
  couponCode: z.string().max(30).nullable().optional(),
  customer: checkoutSchema,
  method: z.enum(["UPI", "Card", "Net banking"]),
  scenario: z.enum(["success", "declined", "error"]),
});

export type OrderRequest = z.input<typeof orderRequestSchema>;

export type PricedOrder =
  | { ok: true; items: CartItem[]; totals: Totals }
  | { ok: false; error: string };

export function priceOrder(
  items: z.infer<typeof itemSchema>[],
  couponCode: string | null | undefined,
  catalog: Pick<Product, "id" | "name" | "price" | "sizes" | "colors" | "slogan">[]
): PricedOrder {
  const lines: CartItem[] = [];

  for (const [n, it] of items.entries()) {
    const label = `Item ${n + 1}`;
    if (it.customization) {
      if (it.productId !== null) return { ok: false, error: `${label}: a custom design can't reference a product.` };
      const hex = STUDIO_COLORS[it.customization.tshirtColor.name];
      if (!hex || it.colorName !== it.customization.tshirtColor.name) {
        return { ok: false, error: `${label}: unknown T-shirt colour.` };
      }
      for (const l of it.customization.layers) {
        if (l.kind === "image" && !l.imageDataUrl) return { ok: false, error: `${label}: an image layer has no image.` };
        if (l.kind === "text" && !(l.text ?? "").trim()) return { ok: false, error: `${label}: a text layer is empty.` };
      }
      const customization: Customization = {
        tshirtColor: { name: it.colorName, hex },
        fit: it.customization.fit,
        layers: it.customization.layers,
      };
      lines.push({
        id: `line-${n}`,
        productId: null,
        name: "Custom T-shirt",
        unitPrice: customPrice(customization).total,
        quantity: it.quantity,
        size: it.size,
        colorName: it.colorName,
        colorHex: hex,
        customization,
      });
      continue;
    }

    const product = catalog.find((p) => p.id === it.productId);
    if (!product) return { ok: false, error: `${label}: that product is no longer available.` };
    if (!product.sizes.includes(it.size)) return { ok: false, error: `${label}: size ${it.size} isn't available for ${product.name}.` };
    const color = product.colors.find((c) => c.name === it.colorName);
    if (!color) return { ok: false, error: `${label}: colour ${it.colorName} isn't available for ${product.name}.` };
    lines.push({
      id: `line-${n}`,
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: it.quantity,
      size: it.size,
      colorName: color.name,
      colorHex: color.hex,
      slogan: product.slogan,
    });
  }

  return { ok: true, items: lines, totals: computeTotals(lines, couponCode ?? null) };
}

/** Limit what an order lookup by ID reveals to someone who only knows the code. */
export function maskCustomer<T extends { name: string; email: string; phone: string; line1: string; city: string; state: string; pin: string }>(c: T): T {
  const [first, ...rest] = c.name.split(" ");
  const [user, domain = ""] = c.email.split("@");
  return {
    ...c,
    name: rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first,
    email: `${user[0] ?? ""}•••@${domain}`,
    phone: `••••••${c.phone.slice(-4)}`,
    line1: "Address hidden for privacy",
    pin: `${c.pin.slice(0, 3)}•••`,
  };
}
