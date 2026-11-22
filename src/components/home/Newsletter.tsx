"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setState(ok ? "done" : "error");
  }

  return (
    <section className="container-page" aria-labelledby="newsletter-title">
      <div className="rounded-3xl bg-olive px-6 py-16 text-center text-ivory sm:px-12">
        <p className="eyebrow !text-beige">Newsletter</p>
        <h2 id="newsletter-title" className="mt-3 font-display text-3xl sm:text-4xl">
          New drops, first.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ivory/80">
          Early access to new designs and studio tips. Demo form — emails are not stored or sent.
        </p>
        {state === "done" ? (
          <p role="status" className="mt-8 font-display text-xl">
            Thanks! This is a demo form, so your email was not saved or sent.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="nl-email" className="sr-only">
              Email address
            </label>
            <input
              id="nl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={state === "error"}
              aria-describedby={state === "error" ? "nl-error" : undefined}
              className="min-h-11 flex-1 rounded-full border border-ivory/30 bg-ivory px-5 text-sm text-charcoal placeholder:text-charcoal/50"
            />
            <Button type="submit" variant="accent">
              Subscribe
            </Button>
          </form>
        )}
        {state === "error" && (
          <p id="nl-error" role="alert" className="mt-3 text-sm text-beige">
            Please enter a valid email address.
          </p>
        )}
      </div>
    </section>
  );
}
