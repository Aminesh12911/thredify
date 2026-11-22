import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getProducts } from "@/lib/products/service";
import { policies } from "@/lib/policies/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics = ["", "/shop", "/studio", "/about", "/contact", "/track", "/policies", ...policies.map((p) => `/policies/${p.slug}`)];
  const entries: MetadataRoute.Sitemap = statics.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, priority: p === "" ? 1 : 0.6 }));
  try {
    for (const p of await getProducts()) entries.push({ url: `${SITE_URL}/shop/${p.slug}`, lastModified: new Date(p.createdAt), priority: 0.8 });
  } catch {
    // Database unreachable: still serve the static part of the sitemap.
  }
  return entries;
}
