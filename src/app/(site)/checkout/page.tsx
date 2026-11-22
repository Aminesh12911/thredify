import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your THREADIFY demo order with a simulated sandbox payment. No real money is taken.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="container-page page-enter py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>
      <div className="mt-8">
        <CheckoutClient />
      </div>
    </main>
  );
}
