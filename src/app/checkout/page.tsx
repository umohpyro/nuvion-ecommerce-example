import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { ConnectNotice } from "@/components/connect-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { readConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Checkout</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}

async function Checkout() {
  const cfg = await readConfig();
  // The encryption key is public by design (it can only encrypt), so it is safe to hand to the browser.
  return (
    <ConnectNotice>
      {cfg && <CheckoutForm publicKey={cfg.encryptionKey} />}
    </ConnectNotice>
  );
}
