"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { DEMO_ADMIN } from "@/lib/auth/demoAuth";
import { ButtonLink } from "@/components/ui/Button";

/** Client-side access check. Shows nothing from the dashboard until the user is a confirmed admin. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, ready, mode } = useAuth();

  if (!ready) return <p role="status" className="py-24 text-center text-charcoal/60">Checking access…</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-ivory p-8 text-center">
        <h1 className="font-display text-3xl">Admin sign-in required</h1>
        <p className="mt-3 text-sm text-charcoal/70">Log in with an administrator account to continue.</p>
        {mode === "demo" && (
          <p className="mt-4 rounded-xl bg-beige p-3 text-left text-xs">
            <strong>Demo mode:</strong> use the built-in demo admin — <code>{DEMO_ADMIN.email}</code> / <code>{DEMO_ADMIN.password}</code>.
            This guard only exists in your browser, so it is not real security; connect Supabase for role-based access enforced by the database.
          </p>
        )}
        <ButtonLink href="/account/login?next=/admin" className="mt-6">Log in</ButtonLink>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div role="alert" className="mx-auto max-w-md rounded-3xl bg-beige p-8 text-center">
        <h1 className="font-display text-3xl">Not authorised</h1>
        <p className="mt-3 text-sm text-charcoal/70">Your account doesn&apos;t have access to the admin dashboard.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4">Back to the store</Link>
      </div>
    );
  }

  return <>{children}</>;
}
