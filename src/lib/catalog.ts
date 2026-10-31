import { UserError } from "@/lib/errors";

/**
 * The product catalog. In a real shop this is your database or CMS. It is a typed file here so the
 * example needs no database, and so the server can look up a price by ID instead of trusting the browser.
 * Prices are integers in cents.
 */
export interface Product {
  slug: string;
  name: string;
  blurb: string;
  priceCents: number;
  /** Tailwind gradient classes for the placeholder artwork, so the demo ships no images. */
  tone: string;
}

export const PRODUCTS: readonly Product[] = [
  { slug: "ethiopia-yirgacheffe", name: "Ethiopia Yirgacheffe", blurb: "Floral and citrus. A light roast with jasmine on the nose.", priceCents: 1800, tone: "from-amber-300 to-orange-500" },
  { slug: "colombia-huila", name: "Colombia Huila", blurb: "Caramel sweetness with red apple. Balanced and easy to drink.", priceCents: 1650, tone: "from-orange-300 to-rose-500" },
  { slug: "kenya-aa", name: "Kenya AA", blurb: "Blackcurrant and brown sugar. Bright, juicy, and complex.", priceCents: 2000, tone: "from-rose-300 to-fuchsia-600" },
  { slug: "brazil-santos", name: "Brazil Santos", blurb: "Chocolate and toasted hazelnut. Low acidity, full body.", priceCents: 1400, tone: "from-stone-400 to-amber-800" },
  { slug: "guatemala-antigua", name: "Guatemala Antigua", blurb: "Cocoa, spice, and orange peel. A medium roast classic.", priceCents: 1700, tone: "from-lime-300 to-emerald-600" },
  { slug: "cold-brew-kit", name: "Cold brew kit", blurb: "A 1 litre jar, reusable filter, and 250 g of the house blend.", priceCents: 3200, tone: "from-sky-300 to-indigo-600" },
] as const;

export const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const SHIPPING_CENTS = 500;
export const MAX_QTY = 10;

export interface CartLine {
  slug: string;
  qty: number;
}

export interface PricedLine extends CartLine {
  product: Product;
  lineCents: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

/**
 * Prices a cart on the server from the catalog. The browser sends only slugs and quantities, never
 * prices, so nobody can pay $0.01 by editing the request. Throws on any unknown product or bad quantity.
 */
export function priceCart(lines: readonly CartLine[]): PricedCart {
  if (lines.length === 0) throw new UserError("Your cart is empty.");
  const priced = lines.map((l) => {
    const product = bySlug(l.slug);
    if (!product) throw new UserError("A product in your cart is no longer available.");
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > MAX_QTY) throw new UserError(`Quantity must be between 1 and ${MAX_QTY}.`);
    return { ...l, product, lineCents: product.priceCents * l.qty };
  });
  const subtotalCents = priced.reduce((sum, l) => sum + l.lineCents, 0);
  return { lines: priced, subtotalCents, shippingCents: SHIPPING_CENTS, totalCents: subtotalCents + SHIPPING_CENTS };
}
