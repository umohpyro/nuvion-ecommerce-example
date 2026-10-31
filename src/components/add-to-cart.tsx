"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

export function AddToCart({ slug, size = "default" }: { slug: string; size?: "default" | "sm" | "lg" }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <Button
      size={size}
      onClick={() => {
        add(slug);
        setAdded(true);
      }}
      aria-live="polite"
    >
      {added ? <Check aria-hidden /> : <ShoppingBag aria-hidden />}
      {added ? "Added" : "Add to cart"}
    </Button>
  );
}
