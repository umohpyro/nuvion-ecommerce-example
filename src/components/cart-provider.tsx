"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { MAX_QTY, type CartLine } from "@/lib/catalog";

/**
 * The cart lives in the browser (localStorage) because this example has no database. It holds only
 * slugs and quantities. Prices are looked up again on the server at checkout, so nothing stored here
 * can change what a shopper pays.
 *
 * It is exposed as an external store so React reads localStorage the supported way: the server render
 * and first client render both see an empty cart, then the real cart appears without a hydration mismatch.
 */
const KEY = "harbor-pine-cart-v1";
const EMPTY = "[]";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// The snapshot is the raw string so React can compare it by value and skip needless renders.
const readRaw = () => localStorage.getItem(KEY) ?? EMPTY;
const readServer = () => EMPTY;
const noopSubscribe = () => () => {};

function parse(raw: string): CartLine[] {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((l): l is CartLine => typeof l?.slug === "string" && Number.isInteger(l?.qty) && l.qty > 0).slice(0, 20);
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  emit();
}

interface CartApi {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, readServer);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const lines = useMemo(() => parse(raw), [raw]);

  const add = useCallback((slug: string, qty = 1) => {
    const cur = parse(readRaw());
    const found = cur.find((l) => l.slug === slug);
    write(found ? cur.map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)) : [...cur, { slug, qty: Math.min(MAX_QTY, qty) }]);
  }, []);
  const setQty = useCallback((slug: string, qty: number) => write(parse(readRaw()).map((l) => (l.slug === slug ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l))), []);
  const remove = useCallback((slug: string) => write(parse(readRaw()).filter((l) => l.slug !== slug)), []);
  const clear = useCallback(() => write([]), []);

  const value = useMemo<CartApi>(() => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), ready, add, setQty, remove, clear }), [lines, ready, add, setQty, remove, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
