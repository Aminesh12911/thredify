import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { ORDER_CODE_PATTERN } from "@/lib/orders/code";
import { mapDbOrder, ORDER_SELECT, type DbOrderRow } from "@/lib/orders/mapDb";
import { maskCustomer } from "@/lib/server/orderPricing";

/**
 * Order lookup by ID (tracking page / confirmation page).
 * Anyone who knows the ID sees the items and status; address, phone and email are masked
 * unless the signed-in customer owns the order.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "The orders API isn't configured (demo mode)." }, { status: 503 });

  const code = decodeURIComponent((await params).code).trim().toUpperCase();
  if (!ORDER_CODE_PATTERN.test(code)) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { data, error } = await admin.from("orders").select(`${ORDER_SELECT}, user_id`).eq("order_code", code).maybeSingle();
  if (error) {
    console.error("order lookup failed", error.code, error.message);
    return NextResponse.json({ error: "Lookup failed. Please try again." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const row = data as unknown as DbOrderRow & { user_id: string | null };
  let isOwner = false;
  const session = await getServerSupabase();
  if (session && row.user_id) {
    const { data: u } = await session.auth.getUser();
    isOwner = u.user?.id === row.user_id;
  }
  const order = mapDbOrder(row);
  return NextResponse.json({ order: isOwner ? order : { ...order, customer: maskCustomer(order.customer) } }, { headers: { "Cache-Control": "no-store" } });
}
