import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your THREADIFY account to see your orders and saved addresses.",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="container-page page-enter py-12 sm:py-16">
      <h1 className="text-center font-display text-4xl sm:text-5xl">Log in</h1>
      <div className="mt-8">
        <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
      </div>
    </main>
  );
}
