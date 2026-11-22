import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/shop/ProductView";
import { ProductCard } from "@/components/shop/ProductCard";
import { getProducts, getProductBySlug, getRelatedProducts } from "@/lib/products/service";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: { title: `${product.name} | THREADIFY`, description: product.description, type: "website", url: `/shop/${product.slug}` },
  };
}

// Re-read the catalogue at most once a minute when backed by Supabase.
export const revalidate = 60;

export default async function ProductPage({ params }: Params) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);

  return (
    <main className="container-page page-enter py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-charcoal/60">
        <Link href="/shop" className="inline-flex min-h-11 items-center hover:text-charcoal">Shop</Link> <span aria-hidden="true">/</span> <span aria-current="page">{product.name}</span>
      </nav>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description,
        sku: product.id, category: product.category, image: `${SITE_URL}/opengraph-image`,
        brand: { "@type": "Brand", name: "THREADIFY" },
        offers: { "@type": "Offer", url: `${SITE_URL}/shop/${product.slug}`, priceCurrency: "INR", price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
      }} />
      <ProductView product={product} />

      <section className="mt-24" aria-labelledby="related-title">
        <h2 id="related-title" className="font-display text-3xl">You may also like</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </main>
  );
}
