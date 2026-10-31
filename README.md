# Nuvion e-commerce example

A small coffee store that takes card payments through the [Nuvion](https://docs.nuvion.co) sandbox. It has **no database**: the catalog is a file, the cart lives in the browser, and Nuvion holds every payment. It runs on Next.js 16, React 19, Tailwind CSS 4 and shadcn/ui.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fumohpyro%2Fnuvion-ecommerce-example&project-name=harbor-pine-shop&repository-name=nuvion-ecommerce-example&env=NUVION_API_KEY,NUVION_ENCRYPTION_PUBLIC_KEY&envDescription=Your%20Nuvion%20sandbox%20API%20key%20and%20its%20encryption%20public%20key&envLink=https%3A%2F%2Fapp.nuvion.dev%2Fdashboard%2Fsettings)

> The button works once this repository is public. After the first deploy, open `/setup` on your site to find your entity and account IDs, add them in Vercel, and redeploy.

## What it shows

| Page | What it demonstrates | Nuvion calls |
|---|---|---|
| Shop, product, cart | Catalog and cart with no server state | none |
| Checkout | Pricing on the server, card encryption in the browser, 3DS | `POST /payment-intents`, `POST /intent-actions` |
| Order | Reading the real payment status, never trusting the URL | `GET /payment-intents/{id}` |
| `/api/webhooks/nuvion` | Signature verification | none (receives `payment_intent.*` events) |
| `/setup` | First-run checks and an ID lookup | `GET /entities`, `GET /accounts` |

## Run it

You need Node.js 20.9 or later, a Nuvion **sandbox** account, and an approved entity with a USD account to receive payments.

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

| Variable | Where to get it |
|---|---|
| `NUVION_API_KEY` | Sandbox dashboard, Settings > Developers |
| `NUVION_ENCRYPTION_PUBLIC_KEY` | Shown next to the API key. Paste the whole `-----BEGIN PUBLIC KEY-----` block. Write line breaks as `\n` in an env file; hosting dashboards also accept real line breaks |
| `NUVION_ENTITY_ID`, `NUVION_ACCOUNT_ID` | Open `/setup`: it lists your approved entities and USD accounts |
| `NUVION_WEBHOOK_SECRET` | Optional. Returned once when you register a webhook |

The values are read when the site is built, so after changing them in a host, redeploy.

Test cards (any future expiry, any 3 digit CVV): `4111 1111 1111 1111` and `5555 5555 5555 4444` approve; `4000 0000 0000 9995` declines for insufficient funds. Real card numbers are refused in the sandbox.

## What to know about Nuvion before you build a shop

These come from running the flow against the sandbox. Each one shapes the code.

1. **Card entry is your page, not a hosted form.** The card is encrypted in the browser with your public key (`src/lib/encrypt-card.ts`), so this app's server never sees the number. That doesn't remove your PCI obligations. Talk to your compliance team before taking real cards.
2. **Child entities need `entity_id` on every call**, including confirming a payment. Leaving it out returns a confusing `404` about a missing "payment intent action".
3. **`reference` is unique per account.** A repeated reference returns `409`. The checkout uses one reference per attempt, so a double click or retry can't charge twice (`src/app/actions.ts`).
4. **The browser never sets the price.** It sends product slugs and quantities; the server prices the cart from the catalog (`priceCart`).
5. **The return from 3DS proves nothing.** The order page reads the payment from Nuvion and only `completed` means paid.
6. **`completed` is not money you can spend yet.** In the sandbox a completed payment leaves the account balance at zero and the matching inflow `pending`. Don't show a completed sale as available revenue.
7. **Refunds can't happen the same day.** The sandbox answers `error_acquiring_refund_same_day_not_supported`. Plan refunds for the next day.
8. **Declines and bad cards differ.** A known test decline returns a failed payment with a reason such as `INSUFFICIENT_FUNDS`. Unknown or invalid numbers return an HTTP `500` with `error_system_dependency_unavailable`, and an American Express test number returned `503`. Map both to "the card couldn't be processed".
9. **The payment-intents list returns its results under `items`**, where most other Nuvion lists use `data`.
10. **Amounts are integers in the smallest unit.** `3950` is $39.50.
11. **Fees:** each payment carries an `applicable_fee`, set by Nuvion's pricing rules. The API docs list no parameter for adding your own platform fee. To take a cut, add it to what the customer pays and move it with a transfer after the funds settle.

## Before this is a real shop

This example leaves out what needs a database. Add these before taking real orders:

- **Order records.** Save each order when you create the payment, so you can list orders and show history.
- **Idempotent fulfillment.** Nuvion retries webhooks and can deliver an event twice. Record each event ID and ship goods exactly once. The webhook route verifies signatures and acknowledges, then points at where this goes.
- **Customer accounts and receipts.**
- **Tax, shipping rates and stock levels.**
- **Rate limiting** on the checkout actions, since the site is public.
- **Production keys and the production encryption key.** Sandbox and production use different key pairs.

## How it is built

```
src/lib/catalog.ts        Products and server-side pricing
src/lib/nuvion.ts         Typed API client and error type
src/lib/encrypt-card.ts   Browser card encryption (RSA-OAEP, SHA-256)
src/lib/webhook.ts        Signature verification
src/app/actions.ts        createOrder and confirmOrder server actions
src/app/order/[id]        Order status read from Nuvion
src/app/setup             First-run checks
```

Server Actions are public endpoints, so each one validates its input with zod and never accepts a price. The API host is checked, not the key prefix: the app refuses any URL that isn't `*.nuvion.dev`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests for pricing and webhook verification |
| `npm run typecheck` | Type-check |
| `npm run lint` | Lint |
