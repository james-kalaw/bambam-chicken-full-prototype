"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CurrentOrderCard } from "@/components/customer/current-order-card";
import { ProductCard } from "@/components/customer/product-card";
import { StoreStatus } from "@/components/customer/store-status";
import { useAddToCart } from "@/components/customer/use-add-to-cart";
import { Mascot } from "@/components/shared/mascot";
import { CATEGORIES } from "@/data/products";
import { useDemoStore } from "@/lib/store";

export default function CustomerHomePage() {
  const { products, customerSession } = useDemoStore();
  const { openFor, dialog } = useAddToCart();
  const popular = products.filter((p) => p.popular);
  const firstName = customerSession?.name.split(" ")[0];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-bambam-red to-[#A82E17] p-6 text-white shadow-lg sm:p-10">
        <div aria-hidden className="absolute -top-16 -right-10 -z-10 size-72 rounded-full bg-bambam-orange/50 blur-2xl" />
        <div className="relative z-10 max-w-md space-y-4">
          <StoreStatus />
          <h1 className="font-display text-4xl leading-tight font-bold text-balance sm:text-5xl">
            {firstName ? `Hi ${firstName}! ` : "Hi! "}What are you craving today?
          </h1>
          <p className="text-base font-medium text-white/95">
            Skip the line between classes. Order ahead, pick up hot.
          </p>
          <Button asChild size="lg" className="h-12 rounded-full bg-white px-6 text-base font-bold text-bambam-red hover:bg-bambam-cream">
            <Link href="/customer/menu">
              Order Now <ArrowRight />
            </Link>
          </Button>
        </div>
        <div aria-hidden className="absolute right-6 bottom-6 hidden size-56 place-items-center rounded-full bg-white shadow-xl sm:grid lg:right-12">
          <Mascot mood="happy" size="lg" priority />
        </div>
        <div aria-hidden className="absolute right-4 bottom-4 grid size-20 place-items-center rounded-full bg-white shadow-lg sm:hidden">
          <Mascot mood="happy" size="sm" priority />
        </div>
      </section>

      <CurrentOrderCard />

      {/* Categories */}
      <section aria-labelledby="categories-title" className="space-y-3">
        <h2 id="categories-title" className="font-display text-2xl font-semibold">Menu categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/customer/menu?category=${c.id}`}
              className="flex items-center gap-3 rounded-2xl border bg-white p-4 font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="leading-tight">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo */}
      <section className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-bambam-orange/60 bg-bambam-yellow/60 p-5">
        <Mascot mood="excited" size="md" />
        <div>
          <p className="inline-flex items-center gap-1 text-xs font-bold tracking-wide text-bambam-red uppercase">
            <Sparkles className="size-3.5" aria-hidden /> Customer favorite
          </p>
          <p className="font-display text-xl font-bold text-bambam-brown">Chicken Chops Rice Meal + Iced Latte</p>
          <p className="text-sm text-bambam-brown/80">Promo banner area — real promos will be set by the owners.</p>
        </div>
      </section>

      {/* Popular */}
      <section aria-labelledby="popular-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mascot mood="hungry" size="sm" />
            <div>
              <h2 id="popular-title" className="font-display text-2xl font-semibold">Bambam Favorites</h2>
              <p className="text-sm text-muted-foreground">Most ordered by students this week</p>
            </div>
          </div>
          <Link href="/customer/menu" className="shrink-0 text-sm font-semibold text-bambam-red hover:underline">See full menu</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} onCustomize={openFor} />
          ))}
        </div>
      </section>

      {!customerSession && (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <Mascot mood="happy" size="md" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold">Save your favorites & track orders</h2>
            <p className="text-sm text-muted-foreground">Sign in once with your mobile number — no password needed.</p>
          </div>
          <Button asChild className="rounded-full"><Link href="/auth/customer">Sign in with mobile</Link></Button>
        </section>
      )}

      {dialog}
    </div>
  );
}
