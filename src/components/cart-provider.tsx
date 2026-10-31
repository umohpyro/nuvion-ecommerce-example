"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_QTY, type CartLine } from "@/lib/catalog";

/**
 * The cart lives in the browser (localStorage) because this example has no database. It holds only
 * slugs and quantities. Prices are looked up again on the server at checkout, so nothing stored here
 * can change what a shopper pays.
 */
const KEY = "harbor-pine-cart-v1";

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

function parse(raw: string | null): CartLine[] {
  try {
    const data = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((l): l is CartLine => typeof l?.slug === "string" && Number.isInteger(l?.qty) && l.qty > 0).slice(0, 20);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount so the server and first client render match.
  useEffect(() => {
    setLines(parse(localStorage.getItem(KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((slug: string, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((l) => l.slug === slug);
      if (found) return cur.map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      return [...cur, { slug, qty: Math.min(MAX_QTY, qty) }];
    });
  }, []);
  const setQty = useCallback((slug: string, qty: number) => setLines((cur) => cur.map((l) => (l.slug === slug ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l))), []);
  const remove = useCallback((slug: string) => setLines((cur) => cur.filter((l) => l.slug !== slug)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), ready, add, setQty, remove, clear }),
    [lines, ready, add, setQty, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
