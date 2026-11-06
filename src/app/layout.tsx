import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { CartProvider } from "@/components/cart-provider";
import { MiniCart } from "@/components/mini-cart";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Harbor & Pine Coffee", template: "%s · Harbor & Pine Coffee" },
  description: "A demo coffee store that takes card payments through the Nuvion sandbox. No real charges are made.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            <p>Harbor &amp; Pine is a demo store built on the Nuvion sandbox. Nothing here is real and no money moves.</p>
          </footer>
          {/* usePathname() reads the URL, so the mini-cart streams in behind Suspense. */}
          <Suspense fallback={null}>
            <MiniCart />
          </Suspense>
        </CartProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
