"use client";

import { Flame, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/product-image";
import { peso } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onCustomize: (product: Product) => void;
}

export function ProductCard({ product, onCustomize }: ProductCardProps) {
  const available = product.availability === "available";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        !available && "opacity-75",
      )}
    >
      <div className="relative">
        <ProductImage emoji={product.emoji} image={product.image} name={product.name} className="aspect-[4/3] w-full" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.popular && available && (
            <span className="inline-flex items-center gap-1 rounded-full bg-bambam-red px-2 py-0.5 text-xs font-bold text-white">
              <Flame className="size-3" aria-hidden /> Popular
            </span>
          )}
          {product.availability === "sold_out" && (
            <span className="rounded-full bg-bambam-brown px-2 py-0.5 text-xs font-bold text-white">Sold out</span>
          )}
          {product.availability === "unavailable" && (
            <span className="rounded-full bg-muted-foreground px-2 py-0.5 text-xs font-bold text-white">Unavailable</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-display text-base leading-tight font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-sm">
            <span className="text-xs text-muted-foreground">from </span>
            <span className="font-bold">{peso(product.basePrice)}</span>
          </p>
          <Button
            size="sm"
            className="h-9 rounded-full px-3 font-semibold"
            disabled={!available}
            onClick={() => onCustomize(product)}
            aria-label={available ? `Customize ${product.name}` : `${product.name} is not available`}
          >
            {available ? (
              <>
                <Plus /> Add
              </>
            ) : (
              "Not available"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
