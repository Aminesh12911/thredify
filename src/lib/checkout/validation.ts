import { z } from "zod";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long."),
  email: z.string().trim().regex(EMAIL, "Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.")),
  line1: z.string().trim().min(5, "Enter your delivery address.").max(160, "Address is too long."),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  state: z.string().refine((v) => INDIAN_STATES.includes(v), "Choose your state."),
  pin: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
});

export type CheckoutValues = z.input<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutValues;

export const emptyCheckout: CheckoutValues = { name: "", email: "", phone: "", line1: "", city: "", state: "", pin: "" };

/** Fictional details for demos and testing. */
export const sampleCheckout: CheckoutValues = {
  name: "Test Customer",
  email: "test.customer@example.com",
  phone: "9876543210",
  line1: "12 Sample Street, Demo Nagar",
  city: "Indore",
  state: "Madhya Pradesh",
  pin: "452001",
};

export function validateCheckout(values: CheckoutValues) {
  const r = checkoutSchema.safeParse(values);
  if (r.success) return { ok: true as const, data: r.data };
  const errors: Partial<Record<CheckoutField, string>> = {};
  for (const issue of r.error.issues) {
    const k = issue.path[0] as CheckoutField;
    if (!errors[k]) errors[k] = issue.message;
  }
  return { ok: false as const, errors };
}
