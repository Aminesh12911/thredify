import type { Metadata } from "next";
import { OrderLookup } from "@/components/orders/OrderLookup";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Enter your THREADIFY order ID to see its demo status and details.",
};

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <main className="container-page page-enter py-10 sm:py-14">
      <p className="eyebrow">Order tracking</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Track your order</h1>
      <div className="mt-8">
        <OrderLookup initialCode={typeof code === "string" ? code : ""} />
      </div>
    </main>
  );
}
