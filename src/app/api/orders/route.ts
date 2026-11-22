import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products/service";
import { orderRequestSchema, priceOrder } from "@/lib/server/orderPricing";
import { resolvePayment } from "@/lib/checkout/gateway";
import { generateOrderCode } from "@/lib/orders/code";

const MAX_BODY_BYTES = 6 * 1024 * 1024; // room for a few small uploaded images
const err = (error: string, status: number, extra: object = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

/**
 * Creates an order. The client sends WHAT it wants; this route decides the price,
 * runs the simulated payment, and writes everything in one database transaction.
 * No real money moves and no card data is accepted or stored.
 */
export async function POST(request: Request) {
  const admin = getAdminSupabase();
  if (!admin) return err("The orders API isn't configured (demo mode).", 503);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return err("Request is too large.", 413);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request.", 400);
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid order details.", 400);
  const req = parsed.data;

  let catalog;
  try {
    catalog = await getProducts();
  } catch {
    return err("The catalogue is temporarily unavailable. Please try again.", 503);
  }

  const priced = priceOrder(req.items, req.couponCode, catalog);
  if (!priced.ok) return err(priced.error, 422);
  const { items, totals } = priced;
  if (req.couponCode && !totals.couponApplied) return err(totals.couponNote ?? "That coupon can't be applied.", 422);

  const payment = resolvePayment(req.scenario);
  if (payment.status === "failed") return err(payment.message, 402, { paymentFailed: true });

  // Attach the order to the signed-in customer (identity comes from the session cookie, never the body).
  let userId: string | null = null;
  const session = await getServerSupabase();
  if (session) {
    const { data } = await session.auth.getUser();
    userId = data.user?.id ?? null;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateOrderCode(new Set(), 8);
    const { error } = await admin.rpc("create_order", {
      p: {
        order_code: code,
        user_id: userId,
        customer_name: req.customer.name,
        email: req.customer.email,
        phone: req.customer.phone,
        ship_line1: req.customer.line1,
        ship_city: req.customer.city,
        ship_state: req.customer.state,
        ship_pin: req.customer.pin,
        subtotal_inr: totals.subtotal,
        shipping_inr: totals.shipping,
        discount_inr: totals.discount,
        total_inr: totals.total,
        coupon_code: totals.couponApplied,
        payment_reference: payment.reference,
        payment_method: req.method,
        items: items.map((i) => ({
          product_id: i.productId,
          name: i.name,
          size: i.size,
          color_name: i.colorName,
          quantity: i.quantity,
          unit_price_inr: i.unitPrice,
          customization: i.customization
            ? { fit: i.customization.fit, tshirt_color: i.customization.tshirtColor.name, layers: i.customization.layers }
            : null,
        })),
      },
    });
    if (!error) return NextResponse.json({ ok: true, code });
    if (error.code === "TH001") {
      // Someone bought the last units between the catalogue read and now (or a stale cart).
      return err(`Sorry, ${error.details ?? "an item"} just sold out or doesn't have enough stock. You have not been charged — please update your cart.`, 409, { outOfStock: true });
    }
    if (error.code !== "23505") {
      console.error("create_order failed", error.code, error.message);
      return err("We couldn't save your order. You have not been charged. Please try again.", 500);
    }
    // 23505 = duplicate order code: try again with a fresh one.
  }
  return err("We couldn't save your order. You have not been charged. Please try again.", 500);
}
