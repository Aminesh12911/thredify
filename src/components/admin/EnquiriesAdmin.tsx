"use client";

import { useMemo, useState } from "react";
import { listEnquiries, setEnquiryStatus, type Enquiry, type EnquiryKind, type EnquiryStatus } from "@/lib/enquiries/service";
import { useAdminQuery, QueryState } from "./useAdminQuery";

const STATUS: Record<EnquiryStatus, string> = { new: "New", in_progress: "In progress", closed: "Closed" };
const KIND: Record<EnquiryKind, string> = { contact: "General", custom_design: "Custom design" };
const field = "min-h-11 rounded-full border border-charcoal/25 bg-ivory px-4 text-sm";
const load = () => listEnquiries();

export function EnquiriesAdmin() {
  const { data, loading, error, reload } = useAdminQuery(load);
  const [kind, setKind] = useState<"all" | EnquiryKind>("all");
  const [status, setStatus] = useState<"all" | EnquiryStatus>("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const rows = useMemo(() => (data ?? []).filter((e) => (kind === "all" || e.kind === kind) && (status === "all" || e.status === status)), [data, kind, status]);

  async function change(e: Enquiry, next: EnquiryStatus) {
    try { await setEnquiryStatus(e.id, next); setMsg({ ok: true, text: `Marked “${e.subject || e.name}” as ${STATUS[next].toLowerCase()}.` }); }
    catch { setMsg({ ok: false, text: "Couldn't update the enquiry." }); }
    reload();
  }

  return (
    <div className="space-y-6">
      <div><p className="eyebrow">Inbox</p><h1 className="mt-1 font-display text-4xl">Enquiries</h1></div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div><label htmlFor="e-kind" className="sr-only">Filter by type</label>
          <select id="e-kind" value={kind} onChange={(e) => setKind(e.target.value as "all" | EnquiryKind)} className={`${field} w-full sm:w-auto`}><option value="all">All types</option>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="e-status" className="sr-only">Filter by status</label>
          <select id="e-status" value={status} onChange={(e) => setStatus(e.target.value as "all" | EnquiryStatus)} className={`${field} w-full sm:w-auto`}><option value="all">All statuses</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </div>
      <p role={msg?.ok === false ? "alert" : "status"} className={`min-h-5 text-sm ${msg?.ok ? "text-olive" : "text-terracotta"}`}>{msg?.text}</p>
      <QueryState loading={loading} error={error}>
        {data && (rows.length === 0 ? (
          <div className="rounded-3xl bg-beige px-6 py-14 text-center"><h2 className="font-display text-2xl">{data.length === 0 ? "No enquiries yet" : "No enquiries match"}</h2><p className="mt-2 text-sm text-charcoal/70">{data.length === 0 ? "Messages from the contact form and custom-design requests will appear here." : "Try different filters."}</p></div>
        ) : (
          <ul className="space-y-3" aria-label="Enquiries">
            {rows.map((e) => (
              <li key={e.id} className="rounded-3xl bg-ivory p-5" data-testid="enquiry-row">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.subject || "(no subject)"} <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${e.kind === "custom_design" ? "bg-terracotta text-ivory" : "bg-beige"}`}>{KIND[e.kind]}</span></p>
                    <p className="text-xs text-charcoal/60">{e.name} · <a href={`mailto:${e.email}`} className="underline underline-offset-2">{e.email}</a> · {new Date(e.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                  </div>
                  <div><label htmlFor={`es-${e.id}`} className="sr-only">Status for {e.subject || e.name}</label>
                    <select id={`es-${e.id}`} value={e.status} onChange={(ev) => change(e, ev.target.value as EnquiryStatus)} className={`${field}`}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-charcoal/80">{e.message}</p>
              </li>
            ))}
          </ul>
        ))}
      </QueryState>
    </div>
  );
}
