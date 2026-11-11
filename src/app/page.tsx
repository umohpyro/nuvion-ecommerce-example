import { Suspense } from "react";
import { ConnectNotice } from "@/components/connect-notice";
import { readConfig } from "@/lib/config";
import { ProductCard } from "@/components/product-card";
import { PRODUCTS } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="grid overflow-hidden rounded-[28px] bg-leaf-deep text-band-foreground md:grid-cols-[1.4fr_1fr]">
          <div className="px-6 py-12 sm:px-12 sm:py-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-sand-fixed">Roasted to order</p>
            <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">Coffee that tastes like where it grew.</h1>
            <p className="mt-5 max-w-lg text-lg text-band-foreground/90 text-pretty">
              Small batches from six farms, roasted the week you order. This is a demo store: it runs on the Nuvion sandbox, so no real charges are made.
            </p>
          </div>
          <dl className="grid content-center gap-px bg-leaf/40 text-sm">
            {[["6", "farms, one roaster"], ["7 days", "from roast to your door"], ["250 g", "bags, whole bean"]].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-3 bg-leaf-deep px-6 py-5 sm:px-10">
                <dt className="text-3xl font-extrabold tabular-nums text-white">{k}</dt>
                <dd className="text-band-foreground/80">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <Suspense fallback={null}>
        <HomeNotice />
      </Suspense>
      <section aria-labelledby="coffees" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="coffees" className="mb-8 flex items-center gap-3 text-2xl font-extrabold tracking-tight"><span className="h-6 w-1.5 rounded-full bg-leaf" aria-hidden />All coffees</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
