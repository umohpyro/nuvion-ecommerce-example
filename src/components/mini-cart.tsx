"use client";

import { ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductArt } from "@/components/product-art";
import { Button, buttonVariants } from "@/components/ui/button";
import { priceCart } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

/** Pages that already show the whole cart, or come after it. The mini-cart would only repeat them. */
const HIDDEN_ON = ["/cart", "/checkout", "/order"];

const noopSubscribe = () => () => {};

/**
 * A cart that follows the shopper, so checkout is one click from any page. It exists only while the cart has
 * something in it. On a wide screen it is a card in the bottom-right corner (it floats over the page, so nothing
 * shifts when it appears). On a phone it is a bar along the bottom.
 */
export function MiniCart() {
  const { lines, count, setQty, remove } = useCart();
  // This component streams in behind Suspense, so by the time it hydrates the cart provider may already hold the real
  // cart. Its own mount flag keeps the first client render equal to the server HTML (nothing), then shows the card.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const pathname = usePathname();
  // Collapsing applies to the current item count only, so adding another item opens the card again.
  const [collapsedAt, setCollapsedAt] = useState<number | null>(null);
  const cart = useMemo(() => {
    if (lines.length === 0) return null;
    try {
      return priceCart(lines);
    } catch {
      return null;
    }
  }, [lines]);

  if (!mounted || !cart || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const collapsed = collapsedAt === count;
  const items = `${count} item${count === 1 ? "" : "s"}`;

  return (
    <>
      <aside aria-label="Your cart" className="fixed right-4 bottom-4 z-40 hidden w-80 animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none lg:block">
        <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl">
          <button
            type="button"
            onClick={() => setCollapsedAt(collapsed ? null : count)}
            aria-expanded={!collapsed}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="size-4" aria-hidden />
              Your cart <span className="font-normal text-muted-foreground">({items})</span>
            </span>
            <span className="flex items-center gap-2 font-semibold tabular-nums">
              {formatMoney(cart.totalCents)}
              {collapsed ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
            </span>
          </button>

          {!collapsed && (
            <div className="border-t">
              <ul className="max-h-64 divide-y overflow-y-auto">
                {cart.lines.map((l) => (
                  <li key={l.slug} className="flex items-center gap-3 px-4 py-3">
                    <ProductArt tone={l.product.tone} name={l.product.name} className="size-12 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${l.slug}`} className="block truncate text-sm font-medium underline-offset-4 hover:underline">{l.product.name}</Link>
                      <div className="mt-1 flex items-center gap-1">
                        <Button variant="outline" size="icon-xs" aria-label={`Decrease quantity of ${l.product.name}`} onClick={() => setQty(l.slug, l.qty - 1)} disabled={l.qty <= 1}><Minus aria-hidden /></Button>
                        <span className="w-6 text-center text-xs tabular-nums" aria-live="polite">{l.qty}</span>
                        <Button variant="outline" size="icon-xs" aria-label={`Increase quantity of ${l.product.name}`} onClick={() => setQty(l.slug, l.qty + 1)}><Plus aria-hidden /></Button>
                        <Button variant="ghost" size="icon-xs" className="ml-1" aria-label={`Remove ${l.product.name}`} onClick={() => remove(l.slug)}><Trash2 aria-hidden /></Button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{formatMoney(l.lineCents)}</p>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(cart.subtotalCents)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="tabular-nums">{formatMoney(cart.shippingCents)}</span></div>
                <Link href="/checkout" className={`${buttonVariants({ size: "lg" })} mt-3 w-full`}>Checkout · {formatMoney(cart.totalCents)}</Link>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t bg-card px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.3)] lg:hidden">
        <Link href="/cart" className="flex min-w-0 items-center gap-2 text-sm">
          <ShoppingBag className="size-4 shrink-0" aria-hidden />
          <span className="truncate"><span className="font-semibold">{items}</span> · {formatMoney(cart.totalCents)}</span>
        </Link>
        <Link href="/checkout" className={buttonVariants()}>Checkout</Link>
      </div>
      {/* Keeps the bottom of the page from hiding under the bar. */}
      <div className="h-20 lg:hidden" aria-hidden />
    </>
  );
}
