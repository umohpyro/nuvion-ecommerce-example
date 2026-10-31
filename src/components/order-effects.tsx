"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

/** Empties the cart once, after the payment is confirmed complete by Nuvion. */
export function ClearCartOnSuccess() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}

/** Re-reads the order every few seconds while a payment is still being processed, for up to two minutes. */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let runs = 0;
    const timer = setInterval(() => {
      runs += 1;
      router.refresh();
      if (runs >= 40) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
