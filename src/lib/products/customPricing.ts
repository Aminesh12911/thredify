import type { Customization } from "@/types";

// Demo pricing rules (INR). Shown to the customer in the studio and reused in the cart.
export const CUSTOM_BASE = 549;
export const PRINT_PER_SIDE = 100;
export const OVERSIZED_FEE = 50;

export function customPrice(c: Pick<Customization, "fit" | "layers">) {
  const sides = new Set(c.layers.map((l) => l.side)).size;
  const printing = sides * PRINT_PER_SIDE;
  const fitFee = c.fit === "Oversized" ? OVERSIZED_FEE : 0;
  return { base: CUSTOM_BASE, printing, fitFee, sides, total: CUSTOM_BASE + printing + fitFee };
}
