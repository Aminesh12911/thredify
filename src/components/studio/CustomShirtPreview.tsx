import type { Customization } from "@/types";
import { TShirtMockup } from "@/components/ui/TShirtMockup";
import { DesignLayers } from "./DesignLayers";

/** Read-only render of a saved customization (used in cart, checkout and orders). */
export function CustomShirtPreview({
  customization,
  side = "front",
  className,
}: {
  customization: Customization;
  side?: "front" | "back";
  className?: string;
}) {
  return (
    <TShirtMockup color={customization.tshirtColor.hex} fit={customization.fit} side={side} className={className}>
      <DesignLayers layers={customization.layers.filter((l) => l.side === side)} />
    </TShirtMockup>
  );
}
