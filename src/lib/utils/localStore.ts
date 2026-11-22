"use client";

import { useSyncExternalStore } from "react";

/** Tiny localStorage-backed external store, safe for SSR via useSyncExternalStore. */
export function createLocalStore<T>(key: string, empty: T) {
  let value = empty;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      value = empty;
    }
  };

  return {
    subscribe(cb: () => void) {
      load();
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          loaded = false;
          value = empty;
          load();
          cb();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      load();
      return value;
    },
    getServerSnapshot: () => empty,
    /** Updates memory and storage. Returns false if the browser refused to persist (quota/blocked). */
    set(next: T): boolean {
      load();
      value = next;
      let persisted = true;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        persisted = false;
      }
      listeners.forEach((l) => l());
      return persisted;
    },
  };
}

export function useStore<T>(store: ReturnType<typeof createLocalStore<T>>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const noopSubscribe = () => () => {};
/** false during SSR/hydration, true afterwards — lets pages show a loader instead of a wrong empty state. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
