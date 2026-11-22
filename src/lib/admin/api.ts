"use client";

import { z } from "zod";
import type { Order, OrderStatus, Product, Size } from "@/types";
import { SIZES } from "@/types";
import { isDemoMode } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createLocalStore } from "@/lib/utils/localStore";
import { STUDIO_COLORS } from "@/lib/products/studioColors";
import { seedProducts } from "@/lib/products/seed";
import { mapDbProduct, type DbProduct } from "@/lib/products/service";
import { ORDER_SELECT, mapDbOrder, type DbOrderRow } from "@/lib/orders/mapDb";
import { getOrdersSnapshot, setStatus } from "@/lib/orders/store";
import { demoUsers } from "@/lib/auth/demoAuth";

export interface AdminProduct extends Product {
  inventory: Record<Size, number>;
}

export const STYLES = ["Minimal", "Typographic", "Illustrated", "Essentials"] as const;
export const COLOR_NAMES = Object.keys(STUDIO_COLORS);

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name (2+ characters).").max(60, "Name is too long."),
  slug: z.string().trim().min(2, "Enter a URL slug.").max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and single hyphens only."),
  price: z.number({ error: "Enter a price." }).int("Price must be a whole number of rupees.").min(1, "Price must be at least ₹1.").max(9999, "Price must be under ₹10,000."),
  category: z.string().trim().min(2, "Enter a category.").max(40),
  style: z.enum(STYLES),
  description: z.string().trim().min(10, "Description needs at least 10 characters.").max(400, "Description is too long (400 max)."),
  slogan: z.string().trim().min(1, "Enter the printed slogan.").max(30, "Slogan is too long (30 max)."),
  colors: z.array(z.enum(COLOR_NAMES as [string, ...string[]])).min(1, "Choose at least one colour."),
  featured: z.boolean(),
  inventory: z.object(Object.fromEntries(SIZES.map((s) => [s, z.number({ error: "Enter stock for every size." }).int("Stock must be whole units.").min(0, "Stock can't be negative.").max(9999, "Stock is too high.")])) as Record<Size, z.ZodNumber>),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export interface AccountRow {
  email: string;
  name: string;
  phone: string;
}

type Result = { ok: true } | { ok: false; error: string };

interface AdminApi {
  listProducts(): Promise<AdminProduct[]>;
  saveProduct(input: ProductInput, id?: string): Promise<Result>;
  deleteProduct(id: string): Promise<Result>;
  listOrders(): Promise<Order[]>;
  updateOrderStatus(code: string, status: OrderStatus): Promise<Result>;
  listAccounts(): Promise<AccountRow[]>;
}

// ------------------------------- Supabase (runs as the signed-in admin; RLS enforces access) ------------------------
const sb = () => getBrowserSupabase()!;
const fail = (error: string): Result => ({ ok: false, error });

const supabaseApi: AdminApi = {
  async listProducts() {
    const { data, error } = await sb()
      .from("products")
      .select("id, slug, name, description, price_inr, style, slogan, colors, featured, created_at, categories(name), inventory(size, stock)")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't load products.");
    return (data as unknown as DbProduct[]).map((r) => {
      const inventory = Object.fromEntries(SIZES.map((s) => [s, r.inventory.find((i) => i.size === s)?.stock ?? 0])) as Record<Size, number>;
      return { ...mapDbProduct(r), inventory };
    });
  },

  async saveProduct(input, id) {
    const db = sb();
    let { data: cat } = await db.from("categories").select("id").eq("name", input.category).maybeSingle();
    if (!cat) {
      const ins = await db.from("categories").insert({ name: input.category, slug: slugify(input.category) }).select("id").single();
      if (ins.error) return fail("Couldn't save the category.");
      cat = ins.data;
    }
    const row = {
      slug: input.slug,
      name: input.name,
      description: input.description,
      price_inr: input.price,
      category_id: cat!.id,
      style: input.style,
      slogan: input.slogan,
      colors: input.colors.map((n) => ({ name: n, hex: STUDIO_COLORS[n] })),
      featured: input.featured,
    };
    const q = id ? db.from("products").update(row).eq("id", id).select("id").single() : db.from("products").insert(row).select("id").single();
    const { data, error } = await q;
    if (error) return fail(error.code === "23505" ? "That URL slug is already used by another product." : "Couldn't save the product. Check you're signed in as an admin.");
    const rows = SIZES.map((size) => ({ product_id: data!.id, size, stock: input.inventory[size] }));
    const inv = await db.from("inventory").upsert(rows, { onConflict: "product_id,size" });
    return inv.error ? fail("The product saved, but its stock couldn't be updated.") : { ok: true };
  },

  async deleteProduct(id) {
    const { error } = await sb().from("products").delete().eq("id", id);
    return error ? fail("Couldn't delete the product.") : { ok: true };
  },

  async listOrders() {
    const { data, error } = await sb().from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error("Couldn't load orders.");
    return (data as unknown as DbOrderRow[]).map(mapDbOrder);
  },

  async updateOrderStatus(code, status) {
    const { data, error } = await sb().from("orders").update({ status }).eq("order_code", code).select("order_code");
    if (error) return fail("Couldn't update the order.");
    return data?.length ? { ok: true } : fail("Order not found, or you don't have permission to change it.");
  },

  async listAccounts() {
    const { data, error } = await sb().from("profiles").select("email, full_name, phone, role");
    if (error) throw new Error("Couldn't load customers.");
    return (data as { email: string | null; full_name: string | null; phone: string | null; role: string }[])
      .filter((p) => p.role !== "admin" && p.email)
      .map((p) => ({ email: p.email!, name: p.full_name ?? "", phone: p.phone ?? "" }));
  },
};

// ------------------------------- Demo mode (browser-local; does NOT change the public shop) -------------------------
const demoProducts = createLocalStore<AdminProduct[] | null>("threadify-demo-admin-products-v1", null);

function demoList(): AdminProduct[] {
  const cur = demoProducts.getSnapshot();
  if (cur) return cur;
  const seeded: AdminProduct[] = seedProducts.map((p) => {
    const per = Math.floor(p.stock / SIZES.length);
    const inventory = Object.fromEntries(SIZES.map((s, i) => [s, per + (i === 0 ? p.stock - per * SIZES.length : 0)])) as Record<Size, number>;
    return { ...p, inventory };
  });
  demoProducts.set(seeded);
  return seeded;
}

const demoApi: AdminApi = {
  async listProducts() {
    return demoList();
  },
  async saveProduct(input, id) {
    const list = demoList();
    if (list.some((p) => p.slug === input.slug && p.id !== id)) return fail("That URL slug is already used by another product.");
    const stock = SIZES.reduce((n, s) => n + input.inventory[s], 0);
    const prev = list.find((p) => p.id === id);
    const next: AdminProduct = {
      id: prev?.id ?? crypto.randomUUID(),
      slug: input.slug,
      name: input.name,
      price: input.price,
      category: input.category,
      style: input.style,
      description: input.description,
      colors: input.colors.map((n) => ({ name: n, hex: STUDIO_COLORS[n] })),
      sizes: SIZES.filter((s) => input.inventory[s] > 0),
      stock,
      createdAt: prev?.createdAt ?? new Date().toISOString().slice(0, 10),
      featured: input.featured,
      slogan: input.slogan,
      inventory: input.inventory,
    };
    demoProducts.set(prev ? list.map((p) => (p.id === id ? next : p)) : [next, ...list]);
    return { ok: true };
  },
  async deleteProduct(id) {
    demoProducts.set(demoList().filter((p) => p.id !== id));
    return { ok: true };
  },
  async listOrders() {
    return getOrdersSnapshot();
  },
  async updateOrderStatus(code, status) {
    if (!getOrdersSnapshot().some((o) => o.code === code)) return fail("Order not found.");
    setStatus(code, status);
    return { ok: true };
  },
  async listAccounts() {
    return Object.values(demoUsers.getSnapshot())
      .filter((u) => u.role !== "admin")
      .map((u) => ({ email: u.email, name: u.name, phone: u.phone }));
  },
};

export const adminApi: AdminApi = isDemoMode ? demoApi : supabaseApi;
