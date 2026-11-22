"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { AdminGuard } from "./AdminGuard";
import { Logo } from "@/components/layout/Header";
import { cn } from "@/lib/utils/format";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, mode, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-charcoal/10 bg-charcoal text-cream">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="!text-base" />
            <span className="rounded-full bg-terracotta px-2.5 py-0.5 text-[11px] uppercase tracking-widest text-ivory">Admin</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link href="/" className="inline-flex min-h-11 items-center px-3 hover:text-terracotta">View store</Link>
            {isAdmin && <button type="button" onClick={() => logout()} className="inline-flex min-h-11 items-center px-3 hover:text-terracotta">Log out</button>}
          </div>
        </div>
        {isAdmin && (
          <nav aria-label="Admin" className="container-page -mb-px flex gap-1 overflow-x-auto pb-0">
            {nav.map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("inline-flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm", active ? "border-terracotta text-ivory" : "border-transparent text-cream/70 hover:text-ivory")}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="container-page py-8">
        {isAdmin && mode === "demo" && (
          <p className="mb-6 rounded-2xl border border-terracotta/40 bg-ivory p-3 text-xs">
            <strong>Demo mode:</strong> data lives in this browser. Order status changes are real within the demo (they show on the tracking page),
            but product changes here do <em>not</em> change the public shop — connect Supabase for live catalogue management.
          </p>
        )}
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
