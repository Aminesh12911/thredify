import type { Metadata } from "next";
import { CartClient } from "@/components/cart/CartClient";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
  description: "Review your THREADIFY cart, apply a demo coupon and continue to checkout.",
};

export default function CartPage() {
  return (
    <main className="container-page page-enter py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Your cart</h1>
      <div className="mt-8">
        <CartClient />
      </div>
    </main>
  );
}
