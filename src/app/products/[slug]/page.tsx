import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductArt } from "@/components/product-art";
import { PRODUCTS, bySlug } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = bySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = bySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-6 text-sm"><Link href="/" className="text-muted-foreground underline-offset-4 hover:underline">← All coffees</Link></p>
      <div className="grid gap-10 md:grid-cols-2">
        <ProductArt tone={product.tone} name={product.name} className="w-full" />
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-balance">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(product.priceCents)}</p>
          <p className="mt-4 text-muted-foreground text-pretty">{product.blurb}</p>
          <ul className="mt-6 space-y-1 text-sm text-muted-foreground">
            <li>250 g bag, roasted to order</li>
            <li>Ships in 2 business days</li>
            <li>Flat $5.00 shipping</li>
          </ul>
          <div className="mt-8"><AddToCart slug={product.slug} size="lg" /></div>
        </div>
      </div>
    </div>
  );
}
