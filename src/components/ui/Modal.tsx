"use client";

import { useEffect, useRef } from "react";

/** Accessible modal built on <dialog>: focus trap, Escape to close, backdrop click to close. */
export function Modal({ open, onClose, label, children, wide }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={label}
      className={`m-auto max-h-[92dvh] w-[min(${wide ? "56rem" : "40rem"},calc(100vw-1.5rem))] overflow-y-auto rounded-3xl bg-cream p-0 text-charcoal backdrop:bg-charcoal/50`}
    >
      {open && (
        <div className="relative p-5 sm:p-8">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-beige">
            <svg width="18" height="18" viewBox="0 0 22 22" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden="true"><path d="M4 4l14 14M18 4L4 18" /></svg>
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
