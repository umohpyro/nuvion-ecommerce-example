import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductArt } from "@/components/product-art";
import type { Product } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col gap-3">
      <Link href={`/products/${product.slug}`} className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label={product.name}>
        <ProductArt tone={product.tone} name={product.name} className="transition-transform duration-300 group-hover:scale-[1.02]" />
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-tight"><Link href={`/products/${product.slug}`} className="underline-offset-4 hover:underline">{product.name}</Link></h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.blurb}</p>
        </div>
        <p className="font-semibold tabular-nums">{formatMoney(product.priceCents)}</p>
      </div>
      <AddToCart slug={product.slug} size="sm" />
    </article>
  );
}
