"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

const input = "min-h-11 w-full rounded-xl border border-charcoal/25 bg-ivory px-3 text-sm";

/** Only allow same-site relative redirects (blocks open-redirect via ?next=https://evil.example). */
export function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/account";
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const auth = useAuth();
  const target = safeNext(next);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const register = mode === "register";

  useEffect(() => {
    if (auth.ready && auth.user) router.replace(target);
  }, [auth.ready, auth.user, router, target]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      const result = register ? await auth.register(name, email, password) : await auth.login(email, password);
      if (!result.ok) return setError(result.error);
      if (result.needsConfirmation) return setNotice("Almost there — check your email and click the confirmation link to activate your account.");
      router.replace(target);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-md space-y-4 rounded-3xl bg-ivory p-6 sm:p-8">
      {auth.mode === "demo" && (
        <p className="rounded-xl bg-beige p-3 text-xs">
          <strong>Demo mode:</strong> accounts are stored only in this browser, with the password salted and hashed. Use a fictional email and a throwaway password.
        </p>
      )}
      {register && (
        <div>
          <label htmlFor="auth-name" className="text-sm font-medium">Full name</label>
          <input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1`} />
        </div>
      )}
      <div>
        <label htmlFor="auth-email" className="text-sm font-medium">Email</label>
        <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1`} />
      </div>
      <div>
        <label htmlFor="auth-password" className="text-sm font-medium">Password</label>
        <input
          id="auth-password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={register ? "pw-hint" : undefined}
          className={`${input} mt-1`}
        />
        {register && <p id="pw-hint" className="mt-1 text-xs text-charcoal/60">At least 8 characters, with a letter and a number.</p>}
      </div>
      <p role="alert" className="min-h-5 text-sm text-terracotta">{error}</p>
      {notice && <p role="status" className="rounded-xl bg-cream p-3 text-sm text-olive">{notice}</p>}
      <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
        {busy ? (register ? "Creating account…" : "Logging in…") : register ? "Create account" : "Log in"}
      </Button>
      <p className="flex flex-wrap items-center justify-center gap-1 text-center text-sm text-charcoal/70">
        {register ? "Already have an account?" : "New to THREADIFY?"}
        <Link href={`/account/${register ? "login" : "register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="inline-flex min-h-11 items-center px-1 underline underline-offset-4">
          {register ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
