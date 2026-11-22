import type { CartItem, Customization, CustomizationLayer, Order, OrderStatus } from "@/types";
import { STUDIO_COLORS } from "@/lib/products/studioColors";

/** Shape returned by: orders.select("*, order_items(*, customizations(*)), payments(*)") */
export interface DbOrderRow {
  order_code: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  ship_line1: string;
  ship_city: string;
  ship_state: string;
  ship_pin: string;
  subtotal_inr: number;
  shipping_inr: number;
  discount_inr: number;
  total_inr: number;
  coupon_code: string | null;
  status: OrderStatus;
  order_items: Array<{
    id: string;
    product_id: string | null;
    name: string;
    size: string;
    color_name: string;
    quantity: number;
    unit_price_inr: number;
    customizations: Array<{ fit: string; tshirt_color: string; layers: CustomizationLayer[] }> | null;
  }>;
  payments: Array<{ status: "succeeded" | "failed"; provider: string; test_reference: string; method: string }> | null;
}

const FALLBACK_HEX = "#EDE6D6";

export function mapDbOrder(r: DbOrderRow): Order {
  const items: CartItem[] = r.order_items.map((i) => {
    const hex = STUDIO_COLORS[i.color_name] ?? FALLBACK_HEX;
    const c = i.customizations?.[0];
    const customization: Customization | undefined = c
      ? { tshirtColor: { name: c.tshirt_color, hex: STUDIO_COLORS[c.tshirt_color] ?? FALLBACK_HEX }, fit: c.fit as Customization["fit"], layers: c.layers }
      : undefined;
    return {
      id: i.id,
      productId: i.product_id,
      name: i.name,
      unitPrice: i.unit_price_inr,
      quantity: i.quantity,
      size: i.size as CartItem["size"],
      colorName: i.color_name,
      colorHex: hex,
      slogan: i.name.toLowerCase(),
      customization,
    };
  });
  const pay = r.payments?.[0];
  return {
    code: r.order_code,
    createdAt: r.created_at,
    customer: { name: r.customer_name, email: r.email, phone: r.phone, line1: r.ship_line1, city: r.ship_city, state: r.ship_state, pin: r.ship_pin },
    items,
    subtotal: r.subtotal_inr,
    discount: r.discount_inr,
    shipping: r.shipping_inr,
    total: r.total_inr,
    couponCode: r.coupon_code,
    payment: {
      status: pay?.status ?? "failed",
      provider: pay?.provider ?? "sandbox-simulator",
      reference: pay?.test_reference ?? "—",
      method: pay?.method ?? "Sandbox",
    },
    status: r.status,
  };
}

export const ORDER_SELECT = "*, order_items(*, customizations(*)), payments(*)";
