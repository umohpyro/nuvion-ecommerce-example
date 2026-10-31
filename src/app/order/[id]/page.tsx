import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AutoRefresh, ClearCartOnSuccess } from "@/components/order-effects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { NuvionError, nuvion, type PaymentIntent } from "@/lib/nuvion";
import { formatDate, formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Order status" };

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Order params={params} />
      </Suspense>
    </div>
  );
}

/** Plain-language reasons for the decline codes Nuvion returns. Unknown codes fall back to a generic line. */
const DECLINES: Record<string, string> = {
  INSUFFICIENT_FUNDS: "The card has insufficient funds.",
};

async function Order({ params }: { params: PageProps<"/order/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9A-Z]{26}$/.test(id)) notFound();

  // The source of truth is Nuvion, never the URL. Returning from 3DS only means the shopper came back.
  let intent: PaymentIntent;
  try {
    intent = await nuvion<PaymentIntent>("GET", `/payment-intents/${id}?entity_id=${env.entityId}`);
  } catch (e) {
    if (e instanceof NuvionError && e.httpStatus === 404) notFound();
    throw e;
  }

  const action = intent.intent_action;
  const paid = intent.status === "completed";
  const failed = intent.status === "failed" || action?.status === "failed";
  const waiting = !paid && !failed && (intent.status === "processing" || action?.status === "pending" || action?.status === "pending_user_action");
  const reason = action?.status_reason ?? intent.status_reason ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          {paid && <CircleCheck className="size-7 text-emerald-600" aria-hidden />}
          {failed && <CircleAlert className="size-7 text-destructive" aria-hidden />}
          {!paid && !failed && <Clock className="size-7 text-amber-600" aria-hidden />}
          {paid ? "Thank you. Your order is confirmed." : failed ? "The payment didn't go through." : waiting ? "Confirming your payment…" : "This order isn't paid."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {paid && <ClearCartOnSuccess />}
        {waiting && <AutoRefresh />}

        {failed && <p>{DECLINES[reason] ?? "The card was declined."} You haven&apos;t been charged. Try again or use a different card.</p>}
        {waiting && <p className="text-muted-foreground">This page updates on its own. Don&apos;t refresh or pay again.</p>}
        {!paid && !failed && !waiting && <p className="text-muted-foreground">Checkout wasn&apos;t completed, so nothing was charged.</p>}

        <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
          <dt className="text-muted-foreground">Order</dt><dd className="font-mono">{intent.reference.slice(0, 8)}</dd>
          <dt className="text-muted-foreground">Items</dt><dd>{intent.description?.replace(/^Order [^:]+: /, "") ?? "—"}</dd>
          <dt className="text-muted-foreground">Total</dt><dd className="tabular-nums">{formatMoney(intent.amount, intent.currency)}</dd>
          {action?.payment_type_data?.last_four_digits && (
            <>
              <dt className="text-muted-foreground">Card</dt>
              <dd className="capitalize">{action.payment_type_data.card_brand ?? "Card"} ending {action.payment_type_data.last_four_digits}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Placed</dt><dd>{formatDate(intent.created)}</dd>
          <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{intent.status.replaceAll("_", " ")}</dd>
        </dl>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button render={<Link href="/" />} nativeButton={false}>{paid ? "Keep shopping" : "Back to the shop"}</Button>
          {!paid && <Button variant="outline" render={<Link href="/checkout" />} nativeButton={false}>Try checkout again</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
