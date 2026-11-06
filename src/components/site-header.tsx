"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-30 bg-band text-band-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground" aria-hidden>H</span>
          <span className="text-xl font-extrabold tracking-tight">Harbor &amp; Pine</span>
          <span className="hidden rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-sand-fixed sm:inline">Demo store</span>
        </Link>
        <nav aria-label="Main" className="flex w-full items-center gap-1 overflow-x-auto pb-1 text-sm font-medium sm:w-auto sm:pb-0 [&>*]:shrink-0 [&>*]:whitespace-nowrap">
          <Link href="/" className="rounded-full px-3 py-2 text-band-foreground/75 hover:bg-white/10 hover:text-band-foreground">Shop</Link>
          <Link href="/settings" className="rounded-full px-3 py-2 text-band-foreground/75 hover:bg-white/10 hover:text-band-foreground">Settings</Link>
          <Link href="/cart" className="relative flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingBag className="size-4" aria-hidden />
            <span>Cart</span>
            {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{count}</span>}
          </Link>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
