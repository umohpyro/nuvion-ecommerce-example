import { Suspense } from "react";
import { ConnectNotice } from "@/components/connect-notice";
import { readConfig } from "@/lib/config";
import { ProductCard } from "@/components/product-card";
import { PRODUCTS } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="rounded-[28px] bg-linear-to-br from-band from-30% to-[#7a1030] px-6 py-14 text-band-foreground sm:px-12 sm:py-20">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-sand-fixed">Roasted to order</p>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">Coffee that tastes like where it grew.</h1>
          <p className="mt-5 max-w-xl text-lg text-band-foreground/90 text-pretty">
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
