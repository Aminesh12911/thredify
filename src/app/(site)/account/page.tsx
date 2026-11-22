import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your THREADIFY profile, order history and saved addresses.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <main className="container-page page-enter py-10 sm:py-14">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Your account</h1>
      <div className="mt-8"><AccountClient /></div>
    </main>
  );
}
