"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/customer/product-card";
import { useAddToCart } from "@/components/customer/use-add-to-cart";
import { EmptyState } from "@/components/shared/empty-state";
import { Mascot } from "@/components/shared/mascot";
import { CATEGORIES } from "@/data/products";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/types/product";

export default function MenuPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense>
      <Menu />
    </Suspense>
  );
}

function Menu() {
  const { products } = useDemoStore();
  const params = useSearchParams();
  const router = useRouter();
  const { openFor, dialog } = useAddToCart();
  const [query, setQuery] = useState("");

  const category = (params.get("category") as ProductCategory | null) ?? "all";
  const visible = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const tabs = [{ id: "all", label: "All", emoji: "✨" }, ...CATEGORIES];

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Mascot mood="hungry" size="md" />
        <div>
          <h1 className="font-display text-3xl font-bold">What are you craving?</h1>
          <p className="text-sm text-muted-foreground">Tap a meal to choose your flavor, dip and add-ons.</p>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          placeholder="Search the menu"
          aria-label="Search the menu"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 rounded-full bg-white pl-9"
        />
      </div>

      {/* Category chips — scroll sideways on small screens */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Menu categories">
        <div className="flex w-max gap-2">
          {tabs.map((t) => {
            const active = category === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => router.replace(t.id === "all" ? "/customer/menu" : `/customer/menu?category=${t.id}`, { scroll: false })}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                  active ? "border-bambam-red bg-bambam-red text-white" : "bg-white hover:bg-muted",
                )}
              >
                <span aria-hidden>{t.emoji}</span> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState mood="thinking" title="No matches" description="Try another word or category." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onCustomize={openFor} />
          ))}
        </div>
      )}

      <Link
        href="/customer/ai"
        className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Mascot mood="thinking" size="sm" />
        <div>
          <p className="font-display text-lg font-semibold">Not sure what to order?</p>
          <p className="text-sm text-muted-foreground">Ask Bambam for a recommendation.</p>
        </div>
      </Link>

      {dialog}
    </div>
  );
}
