import { Suspense } from "react";
import { ConnectNotice } from "@/components/connect-notice";
import { readConfig } from "@/lib/config";
import { ProductCard } from "@/components/product-card";
import { PRODUCTS } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-accent/60 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Roasted to order</p>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">Coffee that tastes like where it grew.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Small batches from six farms, roasted the week you order. This is a demo store: it runs on the Nuvion sandbox, so no real charges are made.
          </p>
        </div>
      </section>
      <Suspense fallback={null}>
        <HomeNotice />
      </Suspense>
      <section aria-labelledby="coffees" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="coffees" className="mb-8 text-2xl font-extrabold tracking-tight">All coffees</h2>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>
    </>
  );
}

/** Only visitors who haven't connected see this. Connected visitors get nothing extra. */
async function HomeNotice() {
  if (await readConfig()) return null;
  return <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6"><ConnectNotice /></div>;
}
