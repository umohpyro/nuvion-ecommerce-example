import assert from "node:assert/strict";
import { test } from "node:test";
import { PRODUCTS, SHIPPING_CENTS, priceCart } from "./catalog.ts";
import { UserError } from "./errors.ts";

test("prices a cart from the catalog, including shipping", () => {
  const a = PRODUCTS[0];
  const b = PRODUCTS[1];
  const cart = priceCart([{ slug: a.slug, qty: 2 }, { slug: b.slug, qty: 1 }]);
  assert.equal(cart.subtotalCents, a.priceCents * 2 + b.priceCents);
  assert.equal(cart.totalCents, cart.subtotalCents + SHIPPING_CENTS);
});

test("ignores any price the caller tries to supply", () => {
  const tampered = [{ slug: PRODUCTS[0].slug, qty: 1, priceCents: 1 }] as unknown as { slug: string; qty: number }[];
  assert.equal(priceCart(tampered).subtotalCents, PRODUCTS[0].priceCents);
});

test("rejects empty carts, unknown products and bad quantities", () => {
  assert.throws(() => priceCart([]), UserError);
  assert.throws(() => priceCart([{ slug: "nope", qty: 1 }]), UserError);
  assert.throws(() => priceCart([{ slug: PRODUCTS[0].slug, qty: 0 }]), UserError);
  assert.throws(() => priceCart([{ slug: PRODUCTS[0].slug, qty: 11 }]), UserError);
  assert.throws(() => priceCart([{ slug: PRODUCTS[0].slug, qty: 1.5 }]), UserError);
  assert.throws(() => priceCart([{ slug: PRODUCTS[0].slug, qty: -3 }]), UserError);
});

test("every product has an integer price in cents", () => {
  for (const p of PRODUCTS) assert.ok(Number.isInteger(p.priceCents) && p.priceCents > 0, p.slug);
});
