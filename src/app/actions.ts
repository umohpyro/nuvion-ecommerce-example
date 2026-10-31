"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { priceCart } from "@/lib/catalog";
import { ConfigError, env } from "@/lib/env";
import { UserError } from "@/lib/errors";
import { NuvionError, nuvion, type IntentAction, type PaymentIntent } from "@/lib/nuvion";
import { CURRENCY } from "@/lib/money";
import { getOrigin } from "@/lib/origin";

/*
 * Server Actions are public POST endpoints, so every input is validated here and nothing
 * sensitive is trusted from the browser. In particular the browser never sends a price.
 */

export type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string; code?: string };

async function guard<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    if (e instanceof NuvionError) return { ok: false, error: friendly(e), code: e.type };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Please check your details." };
    if (e instanceof UserError) return { ok: false, error: e.message };
    if (e instanceof ConfigError) return { ok: false, error: `${e.message} The shop owner can finish setup at /setup.`, code: "config" };
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Turns Nuvion error types into sentences a shopper can act on. */
function friendly(e: NuvionError): string {
  switch (e.type) {
    case "error_acquiring_decryption_failed":
      return "The card details couldn't be read. The shop's encryption key is probably from the wrong environment.";
    case "error_acquiring_payment_processing_failed":
    case "error_system_dependency_unavailable":
      return "The card couldn't be processed. Check the details, or try a different card.";
    default:
      return e.summary;
  }
}

const cartSchema = z.object({
  orderId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/, "Invalid order reference."),
  lines: z.array(z.object({ slug: z.string().max(80), qty: z.number() })).min(1, "Your cart is empty.").max(20),
  customer: z.object({
    firstName: z.string().trim().min(1, "First name is required.").max(60),
    lastName: z.string().trim().min(1, "Last name is required.").max(60),
    email: z.string().trim().email("Enter a valid email address."),
  }),
});

/**
 * Step 1: price the cart on the server and create the payment intent. No money moves yet.
 *
 * `orderId` is generated once per checkout page load and used as the intent `reference`. Nuvion
 * rejects a repeated reference with 409, so a double click or a retry can't create two charges.
 * On 409 we look the existing intent up instead of failing.
 */
export async function createOrder(input: z.input<typeof cartSchema>) {
  return guard(async () => {
    const v = cartSchema.parse(input);
    const cart = priceCart(v.lines);
    const summary = cart.lines.map((l) => `${l.qty}x ${l.product.name}`).join(", ").slice(0, 150);

    try {
      const intent = await nuvion<PaymentIntent>("POST", "/payment-intents", {
        currency: CURRENCY,
        amount: cart.totalCents,
        account_id: env.accountId,
        entity_id: env.entityId,
        reference: v.orderId,
        description: `Order ${v.orderId.slice(0, 8)}: ${summary}`,
      });
      return { intentId: intent.id, totalCents: cart.totalCents };
    } catch (e) {
      if (!(e instanceof NuvionError) || e.type !== "error_duplicate_resource") throw e;
      // This list returns its results under `items`, unlike most other Nuvion lists, which use `data`.
      const page = await nuvion<{ items: PaymentIntent[] }>("GET", `/payment-intents?reference=${encodeURIComponent(v.orderId)}&entity_id=${env.entityId}`);
      const existing = page.items[0];
      if (!existing || existing.status !== "requires_action") throw new UserError("This order was already submitted. Refresh the page to start a new one.");
      return { intentId: existing.id, totalCents: existing.amount };
    }
  });
}

const confirmSchema = z.object({
  intentId: z.string().regex(/^[0-9A-Z]{26}$/, "Invalid payment."),
  encryptedCard: z.string().min(100).max(2000),
  customer: cartSchema.shape.customer,
  billing: z.object({
    line1: z.string().trim().min(1, "Street address is required.").max(100),
    city: z.string().trim().min(1, "City is required.").max(60),
    state: z.string().trim().min(2, "State is required.").max(40),
    zip: z.string().trim().min(3, "ZIP code is required.").max(12),
    country: z.string().regex(/^[A-Z]{2}$/, "Choose a country."),
  }),
  browser: z.object({
    language: z.string().max(20),
    screenWidth: z.string().max(6),
    screenHeight: z.string().max(6),
    colorDepth: z.string().max(3),
    timezoneOffset: z.string().max(6),
  }),
});

/**
 * Step 2: confirm the intent with the card details the browser already encrypted. The server never
 * sees the card number. 3DS is on by default: if the issuer wants a challenge, the response carries a
 * URL to send the shopper to, and Nuvion returns them to /order/[id] afterwards.
 */
export async function confirmOrder(input: z.input<typeof confirmSchema>) {
  return guard(async () => {
    const v = confirmSchema.parse(input);
    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "127.0.0.1";

    const action = await nuvion<IntentAction>("POST", "/intent-actions", {
      payment_intent_id: v.intentId,
      entity_id: env.entityId,
      intent_action: {
        action: "confirm",
        category: "collections",
        payment_type: "card-acq",
        payment_type_data: {
          data: v.encryptedCard,
          auth_model: "3ds_required",
          billing_address: { address_line_one: v.billing.line1, city: v.billing.city, state: v.billing.state, zip: v.billing.zip, country: v.billing.country },
          browser_info: {
            accept_header: h.get("accept") ?? "text/html",
            user_agent: h.get("user-agent") ?? "unknown",
            language: v.browser.language,
            screen_width: v.browser.screenWidth,
            screen_height: v.browser.screenHeight,
            color_depth: v.browser.colorDepth,
            timezone_offset: v.browser.timezoneOffset,
            java_enabled: false,
            javascript_enabled: true,
            channel: "browser",
            ip_address: ip,
          },
        },
        customer: { first_name: v.customer.firstName, last_name: v.customer.lastName, email: v.customer.email },
        return_url: `${await getOrigin()}/order/${v.intentId}`,
      },
    });

    // Never treat this response as final. Only `completed` on the intent, read from Nuvion, means paid.
    return { status: action.status, challengeUrl: action.requires_action ? (action.next_action?.url ?? null) : null };
  });
}
