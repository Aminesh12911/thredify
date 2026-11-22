import type { Metadata } from "next";
import { OrderLookup } from "@/components/orders/OrderLookup";

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "Your THREADIFY demo order confirmation.",
  robots: { index: false },
};

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="container-page page-enter py-10 sm:py-14">
      <OrderLookup fixedCode={decodeURIComponent(code)} />
    </main>
  );
}
