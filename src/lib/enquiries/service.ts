"use client";

import { z } from "zod";
import { isDemoMode } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createLocalStore } from "@/lib/utils/localStore";

export type EnquiryKind = "contact" | "custom_design";
export type EnquiryStatus = "new" | "in_progress" | "closed";

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  kind: EnquiryKind;
  status: EnquiryStatus;
  createdAt: string;
}

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address."),
  subject: z.string().trim().max(100, "Subject is too long.").optional().default(""),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(1000, "Please keep it under 1000 characters."),
  kind: z.enum(["contact", "custom_design"]),
});
export type EnquiryInput = z.input<typeof enquirySchema>;

const EMPTY: Enquiry[] = [];
export const demoEnquiries = createLocalStore<Enquiry[]>("threadify-demo-enquiries-v1", EMPTY);

interface Row {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  kind: EnquiryKind;
  status: EnquiryStatus;
  created_at: string;
}
const fromRow = (r: Row): Enquiry => ({ id: r.id, name: r.name, email: r.email, subject: r.subject ?? "", message: r.message, kind: r.kind, status: r.status, createdAt: r.created_at });

/** Public: anyone may submit (RLS allows insert, but only admins can read). */
export async function submitEnquiry(input: EnquiryInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const v = enquirySchema.safeParse(input);
  if (!v.success) return { ok: false, error: v.error.issues[0]?.message ?? "Please check the form." };
  if (isDemoMode) {
    demoEnquiries.set([{ id: crypto.randomUUID(), ...v.data, status: "new", createdAt: new Date().toISOString() }, ...demoEnquiries.getSnapshot()]);
    return { ok: true };
  }
  const { error } = await getBrowserSupabase()!.from("enquiries").insert(v.data);
  return error ? { ok: false, error: "We couldn't send your message. Please try again." } : { ok: true };
}

/** Admin only (RLS enforces this). */
export async function listEnquiries(): Promise<Enquiry[]> {
  if (isDemoMode) return demoEnquiries.getSnapshot();
  const { data, error } = await getBrowserSupabase()!.from("enquiries").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Couldn't load enquiries.");
  return (data as Row[]).map(fromRow);
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<void> {
  if (isDemoMode) {
    demoEnquiries.set(demoEnquiries.getSnapshot().map((e) => (e.id === id ? { ...e, status } : e)));
    return;
  }
  const { error } = await getBrowserSupabase()!.from("enquiries").update({ status }).eq("id", id);
  if (error) throw new Error("Couldn't update the enquiry.");
}
