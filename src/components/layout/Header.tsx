"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/AuthProvider";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/studio", label: "Custom Studio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/track", label: "Track Order" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="THREADIFY home" className={`inline-flex min-h-11 items-center font-display text-xl tracking-[0.28em] ${className}`}>
      THREADIFY
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user, ready } = useAuth();
  const accountLabel = ready && user ? user.name.split(" ")[0] || "Account" : "Account";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center text-sm tracking-wide transition-colors hover:text-terracotta">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/account" className="hidden min-h-11 items-center px-3 text-sm hover:text-terracotta md:inline-flex">
            {accountLabel}
          </Link>
          <Link href="/cart" className="inline-flex min-h-11 items-center px-3 text-sm hover:text-terracotta" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            Cart{count > 0 && <span className="ml-1.5 rounded-full bg-terracotta px-2 py-0.5 text-[11px] text-ivory">{count}</span>}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {open ? <path d="M4 4l14 14M18 4L4 18" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto bg-cream md:hidden">
          <ul className="container-page flex flex-col py-6">
            {[...links, { href: "/account", label: accountLabel }].map((l) => (
              <li key={l.href} className="border-b border-charcoal/10">
                <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-14 items-center font-display text-2xl">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
