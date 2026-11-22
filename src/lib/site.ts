/** Single source of truth for sample business details. ALL values are fictional placeholders. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const BUSINESS = {
  name: "THREADIFY",
  legalName: "Threadify Studio (sample, not a registered business)",
  tagline: "Wear Your Point of View.",
  email: "hello@threadify.example",
  phone: "+91 00000 00000",
  address: ["Sample Address, 000 Placeholder Road", "Indore, Madhya Pradesh 452001", "India"],
  hours: "Mon–Sat, 10:00–18:00 IST (sample)",
  responseTime: "within 2 working days (sample)",
} as const;

export const FAQ: { q: string; a: string }[] = [
  { q: "Is THREADIFY a real shop?", a: "No. THREADIFY is an academic demonstration store. No real orders are fulfilled, no real money is accepted and every business detail on this site is a placeholder." },
  { q: "How does the sandbox payment work?", a: "At checkout you choose a method and a test scenario (success, failure and so on). The result is simulated. The site never asks for card numbers, CVV, UPI PINs or any payment credentials." },
  { q: "How do I design my own T-shirt?", a: "Open the Custom Studio, pick a colour and size, add text or upload artwork, drag and resize it on the front or back, then add it to your cart. The price updates as you add print sides." },
  { q: "What image files can I upload?", a: "PNG or JPG artwork. Only upload artwork you own or have permission to use; we would review designs that infringe someone else's rights before printing in a real shop." },
  { q: "How do I track an order?", a: "Use Track Order with your order ID (for example THR-20261001-ABCDE). Signed-in customers can also see their orders under Account." },
  { q: "Which sizes do you offer?", a: "S, M, L, XL and XXL. See the size guide on each product page. Stock is tracked per size, so a size can be sold out while others remain." },
  { q: "Can I cancel or return an order?", a: "The sample policies describe a cancellation window before printing starts and a return window for unworn, unprinted items. Custom-printed items are final-sale except for defects. See the Refund & Cancellation page." },
  { q: "How long would delivery take?", a: "The sample shipping policy estimates 5–8 working days for custom items and 3–5 for ready-made tees. Free shipping applies above ₹999; otherwise a flat ₹79." },
];
