"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductArt } from "@/components/product-art";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { priceCart } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export function CartView() {
  const { lines, ready, setQty, remove } = useCart();
  const cart = useMemo(() => {
    try {
      return priceCart(lines);
    } catch {
      return null;
    }
  }, [lines]);

  if (!ready) return <p className="text-sm text-muted-foreground">Loading your cart…</p>;
  if (!cart) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
          <Button render={<Link href="/" />} nativeButton={false}>Browse the shop</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-4">
        {cart.lines.map((l) => (
          <li key={l.slug}>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <ProductArt tone={l.product.tone} name={l.product.name} className="size-20 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${l.slug}`} className="font-semibold underline-offset-4 hover:underline">{l.product.name}</Link>
                  <p className="text-sm text-muted-foreground">{formatMoney(l.product.priceCents)} each</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button variant="outline" size="icon-sm" aria-label={`Decrease quantity of ${l.product.name}`} onClick={() => setQty(l.slug, l.qty - 1)} disabled={l.qty <= 1}><Minus aria-hidden /></Button>
                    <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{l.qty}</span>
                    <Button variant="outline" size="icon-sm" aria-label={`Increase quantity of ${l.product.name}`} onClick={() => setQty(l.slug, l.qty + 1)}><Plus aria-hidden /></Button>
                    <Button variant="ghost" size="icon-sm" className="ml-2" aria-label={`Remove ${l.product.name}`} onClick={() => remove(l.slug)}><Trash2 aria-hidden /></Button>
                  </div>
                </div>
                <p className="font-semibold tabular-nums">{formatMoney(l.lineCents)}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(cart.subtotalCents)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="tabular-nums">{formatMoney(cart.shippingCents)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatMoney(cart.totalCents)}</span></div>
            <Button size="lg" className="mt-4 w-full" render={<Link href="/checkout" />} nativeButton={false}>Checkout</Button>
            <p className="pt-2 text-xs text-muted-foreground">The final price is calculated again on the server at checkout.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
