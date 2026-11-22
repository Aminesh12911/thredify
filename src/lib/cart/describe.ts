import type { Customization } from "@/types";
import { getFont } from "@/lib/products/studioFonts";

/** Human-readable summary of a custom design for the cart, checkout and orders. */
export function describeCustomization(c: Customization): string[] {
  const lines = [`${c.fit} fit`];
  for (const side of ["front", "back"] as const) {
    const ls = c.layers.filter((l) => l.side === side);
    if (ls.length === 0) continue;
    const parts = ls.map((l) =>
      l.kind === "image" ? "uploaded image" : `text “${l.text}” (${getFont(l.font).label})`
    );
    lines.push(`${side === "front" ? "Front" : "Back"} print: ${parts.join(", ")}`);
  }
  return lines;
}
