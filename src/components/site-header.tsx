"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">Harbor &amp; Pine</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">Demo store</Badge>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
          <Link href="/" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Shop</Link>
          <Link href="/settings" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Settings</Link>
          <Link href="/cart" className="relative flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingBag className="size-4" aria-hidden />
            <span>Cart</span>
            {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
