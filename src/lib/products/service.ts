import type { Product, ProductColor, Size, Style } from "@/types";
import { SIZES } from "@/types";
import { getPublicSupabase } from "@/lib/supabase/public";
import { seedProducts } from "./seed";

/**
 * Product service. Demo mode (no Supabase keys) serves seed data. With Supabase configured
 * it reads the database and FAILS LOUDLY on error rather than silently showing seed data,
 * which would hide a misconfiguration and let orders reference products that don't exist.
 */
export interface DbProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_inr: number;
  style: string;
  slogan: string | null;
  colors: ProductColor[];
  featured: boolean;
  created_at: string;
  categories: { name: string } | null;
  inventory: { size: string; stock: number }[];
}

export function mapDbProduct(r: DbProduct): Product {
  const inStock = r.inventory.filter((i) => i.stock > 0 && (SIZES as string[]).includes(i.size));
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    price: r.price_inr,
    category: r.categories?.name ?? r.style,
    style: r.style as Style,
    description: r.description,
    colors: r.colors,
    sizes: SIZES.filter((s) => inStock.some((i) => i.size === s)) as Size[],
    stock: r.inventory.reduce((n, i) => n + i.stock, 0),
    createdAt: r.created_at.slice(0, 10),
    featured: r.featured,
    slogan: r.slogan ?? r.name.toLowerCase(),
  };
}

export async function getProducts(): Promise<Product[]> {
  const db = getPublicSupabase();
  if (!db) return seedProducts;
  const { data, error } = await db
    .from("products")
    .select("id, slug, name, description, price_inr, style, slogan, colors, featured, created_at, categories(name), inventory(size, stock)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load products from Supabase: ${error.message}`);
  return (data as unknown as DbProduct[]).map(mapDbProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const others = (await getProducts()).filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.style === product.style);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, limit);
}
