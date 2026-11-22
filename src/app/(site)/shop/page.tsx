import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/ShopClient";
import { getProducts } from "@/lib/products/service";

export const metadata: Metadata = {
  title: "Shop the collection",
  description: "Browse THREADIFY graphic T-shirts. Search, filter by size, colour, price and style, and quick view any design.",
};

// Re-read the catalogue at most once a minute when backed by Supabase.
export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <main id="collection" className="container-page page-enter py-12">
      <p className="eyebrow">Shop</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">The collection</h1>
      <ShopClient products={products} />
    </main>
  );
}
