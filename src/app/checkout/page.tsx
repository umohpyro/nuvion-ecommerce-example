import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  const ready = env.status.apiKey && env.status.entityId && env.status.accountId && env.status.encryptionKey;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Checkout</h1>
      {ready ? (
        // The encryption key is public by design (it can only encrypt), so it is safe to hand to the browser.
        <CheckoutForm publicKey={env.encryptionKey} />
      ) : (
        <Alert>
          <AlertTitle>This shop isn&apos;t set up yet</AlertTitle>
          <AlertDescription>
            Payments need a sandbox API key, a merchant entity, an account and an encryption key. <Link href="/setup" className="font-medium underline underline-offset-4">Open the setup page</Link> to finish.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
