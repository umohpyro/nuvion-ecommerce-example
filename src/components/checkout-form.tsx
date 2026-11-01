"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ComponentProps } from "react";
import { toast } from "sonner";
import { confirmOrder, createOrder } from "@/app/actions";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { priceCart } from "@/lib/catalog";
import { encryptCard, luhnValid } from "@/lib/encrypt-card";
import { formatMoney } from "@/lib/money";

/** Sandbox cards that behave differently, so developers can see each outcome. Tested against the sandbox. */
const TEST_CARDS = [
  { label: "Approved (Visa)", number: "4111 1111 1111 1111" },
  { label: "Approved (Mastercard)", number: "5555 5555 5555 4444" },
  { label: "Declined: insufficient funds", number: "4000 0000 0000 9995" },
] as const;

function Field({ label, id, className, ...props }: { label: string; id: string } & ComponentProps<typeof Input>) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block">{label}</Label>
      <Input id={id} name={id} required {...props} />
    </div>
  );
}

export function CheckoutForm({ publicKey }: { publicKey: string }) {
  const router = useRouter();
  const { lines, ready } = useCart();
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  // Created on the first submit and kept for the life of the page. It becomes the payment reference, so a
  // double click or a retry reuses the same payment instead of charging twice. (Made here, not during
  // render, because a random value in render can't be prerendered.)
  const orderIdRef = useRef<string | null>(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", holder: "" });

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
        <CardContent className="py-10 text-center">
          <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
          <Button render={<Link href="/" />} nativeButton={false}>Browse the shop</Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    orderIdRef.current ??= crypto.randomUUID();
    const orderId = orderIdRef.current;
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();

    const [month = "", yearRaw = ""] = card.expiry.split("/").map((s) => s.trim());
    if (!luhnValid(card.number)) return void toast.error("That card number doesn't look right. Check it and try again.");
    if (!/^(0[1-9]|1[0-2])$/.test(month) || !/^\d{2}$/.test(yearRaw)) return void toast.error("Enter the expiry date as MM / YY.");

    setPending(true);
    setError("");
    try {
      setStep("Creating your order…");
      const order = await createOrder({
        orderId,
        lines,
        customer: { firstName: text("firstName"), lastName: text("lastName"), email: text("email") },
      });
      if (!order.ok) throw new Error(order.error);

      setStep("Encrypting your card…");
      const encryptedCard = await encryptCard(publicKey, { number: card.number, month, year: yearRaw, cvv: card.cvv, holder: card.holder });

      setStep("Confirming payment…");
      const paid = await confirmOrder({
        intentId: order.intentId,
        encryptedCard,
        customer: { firstName: text("firstName"), lastName: text("lastName"), email: text("email") },
        billing: { line1: text("line1"), city: text("city"), state: text("state"), zip: text("zip"), country: "US" },
        browser: {
          language: navigator.language,
          screenWidth: String(screen.width),
          screenHeight: String(screen.height),
          colorDepth: String(screen.colorDepth),
          timezoneOffset: String(new Date().getTimezoneOffset()),
        },
      });
      if (!paid.ok) throw new Error(paid.error);

      // The issuer asked for a 3DS challenge: send the shopper there. Otherwise show the order page,
      // which reads the real status from Nuvion.
      if (paid.challengeUrl) {
        window.location.assign(paid.challengeUrl);
        return;
      }
      // The cart stays until the order page sees a paid status, so a declined card can retry with the same items.
      router.push(`/order/${order.intentId}`);
    } catch (err) {
      // WebCrypto errors often have an empty message, so fall back to the error name.
      const message = (err instanceof Error && (err.message || err.name)) || "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
      setPending(false);
      setStep("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" id="firstName" autoComplete="given-name" defaultValue="Ada" />
            <Field label="Last name" id="lastName" autoComplete="family-name" defaultValue="Lovelace" />
            <Field label="Email" id="email" type="email" autoComplete="email" defaultValue="ada@example.com" className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Billing address</CardTitle><CardDescription>United States only in this demo.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-6">
            <Field label="Street address" id="line1" autoComplete="address-line1" defaultValue="350 Fifth Avenue" className="sm:col-span-6" />
            <Field label="City" id="city" autoComplete="address-level2" defaultValue="New York" className="sm:col-span-3" />
            <Field label="State" id="state" autoComplete="address-level1" defaultValue="NY" className="sm:col-span-1" />
            <Field label="ZIP code" id="zip" autoComplete="postal-code" defaultValue="10118" className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="size-4" aria-hidden /> Payment</CardTitle>
            <CardDescription>Your card is encrypted in this browser before it is sent. This shop&apos;s server never sees the number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="Card number" id="cc-number" autoComplete="cc-number" inputMode="numeric" placeholder="4111 1111 1111 1111" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} className="sm:col-span-6" />
              <Field label="Name on card" id="cc-name" autoComplete="cc-name" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} className="sm:col-span-6" />
              <Field label="Expiry (MM / YY)" id="cc-exp" autoComplete="cc-exp" inputMode="numeric" placeholder="12 / 30" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} className="sm:col-span-3" />
              <Field label="CVV" id="cc-csc" autoComplete="cc-csc" inputMode="numeric" maxLength={4} placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} className="sm:col-span-3" />
            </div>

            <div className="rounded-lg border border-dashed p-3 text-sm">
              <p className="font-medium">Sandbox test cards</p>
              <p className="mb-2 text-muted-foreground">Use any future expiry and any 3 digit CVV. Real card numbers are refused.</p>
              <div className="flex flex-wrap gap-2">
                {TEST_CARDS.map((c) => (
                  <Button key={c.number} type="button" size="sm" variant="outline" onClick={() => setCard({ number: c.number, expiry: "12 / 30", cvv: "123", holder: "Ada Lovelace" })}>
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="space-y-2">
              {cart.lines.map((l) => (
                <li key={l.slug} className="flex justify-between gap-3">
                  <span>{l.qty} × {l.product.name}</span>
                  <span className="tabular-nums">{formatMoney(l.lineCents)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t pt-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(cart.subtotalCents)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="tabular-nums">{formatMoney(cart.shippingCents)}</span></div>
              <div className="flex justify-between pt-1 text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatMoney(cart.totalCents)}</span></div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? step || "Processing…" : `Pay ${formatMoney(cart.totalCents)}`}</Button>
            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">Demo store on the Nuvion sandbox. No real charges are made.</p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
