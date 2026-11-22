import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a THREADIFY account to track orders and save delivery addresses.",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="container-page page-enter py-12 sm:py-16">
      <h1 className="text-center font-display text-4xl sm:text-5xl">Create your account</h1>
      <div className="mt-8">
        <AuthForm mode="register" next={typeof next === "string" ? next : undefined} />
      </div>
    </main>
  );
}
