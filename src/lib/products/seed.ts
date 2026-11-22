import type { Product, ProductColor } from "@/types";

export const C: Record<string, ProductColor> = {
  cream: { name: "Cream", hex: "#EDE6D6" },
  charcoal: { name: "Charcoal", hex: "#252820" },
  olive: { name: "Olive", hex: "#667052" },
  terracotta: { name: "Terracotta", hex: "#B87958" },
  sand: { name: "Sand", hex: "#D8CDB6" },
  ivory: { name: "Ivory", hex: "#FFFDF8" },
};

const allSizes = ["S", "M", "L", "XL", "XXL"] as const;

export const seedProducts: Product[] = [
  {
    id: "p1", slug: "the-quiet-type", name: "The Quiet Type", price: 599,
    category: "Typographic", style: "Typographic",
    description: "A soft-spoken statement tee for people who say more by saying less. Heavyweight cotton with a clean chest print.",
    colors: [C.cream, C.charcoal, C.olive], sizes: [...allSizes], stock: 48,
    createdAt: "2026-10-28", featured: true, slogan: "the quiet type",
  },
  {
    id: "p2", slug: "grounded", name: "Grounded", price: 549,
    category: "Minimal", style: "Minimal",
    description: "Earthy and calm. A small centred mark on a relaxed everyday fit.",
    colors: [C.olive, C.sand, C.charcoal], sizes: [...allSizes], stock: 62,
    createdAt: "2026-10-12", featured: true, slogan: "grounded",
  },
  {
    id: "p3", slug: "off-script", name: "Off Script", price: 649,
    category: "Illustrated", style: "Illustrated",
    description: "For the ones who skip the plan. Bold back print, understated front.",
    colors: [C.charcoal, C.terracotta, C.cream], sizes: [...allSizes], stock: 35,
    createdAt: "2026-11-05", featured: true, slogan: "off script",
  },
  {
    id: "p4", slug: "everyday-essential", name: "Everyday Essential", price: 499,
    category: "Essentials", style: "Essentials",
    description: "The plain tee, done properly. Soft, durable and made to be worn on repeat.",
    colors: [C.ivory, C.charcoal, C.olive, C.terracotta], sizes: [...allSizes], stock: 120,
    createdAt: "2026-09-20", featured: false, slogan: "essential",
  },
  {
    id: "p5", slug: "slow-living", name: "Slow Living", price: 599,
    category: "Typographic", style: "Typographic",
    description: "A reminder to take the long way home. Tonal print on a washed finish.",
    colors: [C.sand, C.olive, C.cream], sizes: [...allSizes], stock: 54,
    createdAt: "2026-11-12", featured: true, slogan: "slow living",
  },
  {
    id: "p6", slug: "unfiltered", name: "Unfiltered", price: 699,
    category: "Illustrated", style: "Illustrated",
    description: "Loud ideas, quiet colours. Our boldest graphic, in a premium oversized cut.",
    colors: [C.terracotta, C.charcoal, C.ivory], sizes: [...allSizes], stock: 28,
    createdAt: "2026-11-16", featured: false, slogan: "unfiltered",
  },
];
