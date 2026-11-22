"use client";

import { useCallback, useEffect, useState } from "react";

/** Loads admin data. `load` must be a stable (module-level or memoised) function. */
export function useAdminQuery<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ data, loading: false }))
      .catch((e: unknown) => !cancelled && setState({ loading: false, error: e instanceof Error ? e.message : "Something went wrong." }));
    return () => {
      cancelled = true;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}

export function QueryState({ loading, error, children }: { loading: boolean; error?: string; children: React.ReactNode }) {
  if (loading) return <p role="status" className="py-16 text-center text-charcoal/60">Loading…</p>;
  if (error) return <p role="alert" className="rounded-2xl bg-beige p-4 text-sm text-terracotta">{error}</p>;
  return <>{children}</>;
}
