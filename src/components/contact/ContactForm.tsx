"use client";

import { useRef, useState } from "react";
import { enquirySchema, submitEnquiry, type EnquiryKind } from "@/lib/enquiries/service";
import { Button } from "@/components/ui/Button";

type F = "name" | "email" | "subject" | "message";
const input = "min-h-11 w-full rounded-xl border border-charcoal/25 bg-ivory px-3 text-sm";

export function ContactForm({ initialKind = "contact" }: { initialKind?: EnquiryKind }) {
  const [v, setV] = useState({ name: "", email: "", subject: "", message: "", kind: initialKind as EnquiryKind });
  const [errors, setErrors] = useState<Partial<Record<F, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState("");
  const busy = useRef(false);
  const ref = useRef<HTMLFormElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const parsed = enquirySchema.safeParse(v);
    if (!parsed.success) {
      const errs: Partial<Record<F, string>> = {};
      for (const i of parsed.error.issues) { const k = i.path[0] as F; errs[k] ??= i.message; }
      setErrors(errs); setFormError("");
      ref.current?.querySelector<HTMLElement>(`#c-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setErrors({}); setFormError(""); busy.current = true; setStatus("sending");
    const r = await submitEnquiry(parsed.data);
    busy.current = false;
    if (!r.ok) { setStatus("idle"); setFormError(r.error); return; }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-3xl bg-ivory p-8" data-testid="contact-success">
        <h2 className="font-display text-3xl">Message sent</h2>
        <p className="mt-3 text-charcoal/75">Thank you, {v.name.split(" ")[0]}. Your message has been recorded. This is a demo store, so no email is sent — the team would see it in the admin Enquiries inbox.</p>
        <Button className="mt-6" variant="secondary" onClick={() => { setV({ name: "", email: "", subject: "", message: "", kind: initialKind }); setStatus("idle"); }}>Send another message</Button>
      </div>
    );
  }

  const text = (k: F, label: string, type = "text", auto?: string) => (
    <div>
      <label htmlFor={`c-${k}`} className="text-sm font-medium">{label}</label>
      <input id={`c-${k}`} name={k} type={type} autoComplete={auto} className={`${input} mt-1`} value={v[k]} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `c-${k}-err` : undefined}
        onChange={(e) => { setV({ ...v, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); }} />
      {errors[k] && <p id={`c-${k}-err`} role="alert" className="mt-1 text-sm text-terracotta">{errors[k]}</p>}
    </div>
  );

  return (
    <form ref={ref} onSubmit={submit} noValidate className="space-y-4 rounded-3xl bg-ivory p-6 sm:p-8" aria-label="Contact form">
      <p className="text-xs text-charcoal/60">Demo store — please use fictional details. Messages are stored only in this browser unless a database is connected.</p>
      <div className="grid gap-4 sm:grid-cols-2">{text("name", "Your name", "text", "name")}{text("email", "Email", "email", "email")}</div>
      <div>
        <label htmlFor="c-kind" className="text-sm font-medium">What is this about?</label>
        <select id="c-kind" className={`${input} mt-1`} value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as EnquiryKind })}>
          <option value="contact">General question</option>
          <option value="custom_design">Custom design request</option>
        </select>
      </div>
      {text("subject", "Subject (optional)")}
      <div>
        <label htmlFor="c-message" className="text-sm font-medium">Message</label>
        <textarea id="c-message" name="message" rows={5} maxLength={1000} className={`${input} mt-1 py-2`} value={v.message} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "c-message-err" : undefined}
          onChange={(e) => { setV({ ...v, message: e.target.value }); if (errors.message) setErrors({ ...errors, message: undefined }); }} />
        <p className="mt-1 text-right text-xs text-charcoal/50">{v.message.length}/1000</p>
        {errors.message && <p id="c-message-err" role="alert" className="mt-1 text-sm text-terracotta">{errors.message}</p>}
      </div>
      <p role="alert" className="min-h-5 text-sm text-terracotta">{formError}</p>
      <Button type="submit" disabled={status === "sending"} aria-busy={status === "sending"}>{status === "sending" ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
