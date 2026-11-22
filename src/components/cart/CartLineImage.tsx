import type { CartItem } from "@/types";
import { TShirtMockup } from "@/components/ui/TShirtMockup";
import { CustomShirtPreview } from "@/components/studio/CustomShirtPreview";

/** Thumbnail for a cart/order line: the ready-made design, or the customer's own artwork. */
export function CartLineImage({ item, className = "w-full" }: { item: CartItem; className?: string }) {
  if (item.customization) {
    const frontHasArt = item.customization.layers.some((l) => l.side === "front");
    return <CustomShirtPreview customization={item.customization} side={frontHasArt ? "front" : "back"} className={className} />;
  }
  return <TShirtMockup color={item.colorHex} slogan={item.slogan} className={className} />;
}
