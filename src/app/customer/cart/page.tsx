"use client";

import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/components/customer/use-add-to-cart";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductImage } from "@/components/shared/product-image";
import { DEMO_CONFIG } from "@/data/demo-config";
import { peso } from "@/lib/format";
import { itemsSubtotal, lineTotal, optionsSummary } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";

export default function CartPage() {
  const { cart, products, setCartQuantity, removeFromCart } = useDemoStore();
  const { openFor, dialog } = useAddToCart();
  const subtotal = itemsSubtotal(cart);
  const fees = DEMO_CONFIG.onlineServiceFee;

  if (cart.length === 0) {
    return (
      <EmptyState
        mood="hungry"
        size="lg"
        title="Your tray is still empty!"
        description="Let's fix that. Bambam favorites are just a tap away."
        action={<Button asChild size="lg" className="rounded-full"><Link href="/customer/menu">Browse Menu</Link></Button>}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section aria-labelledby="cart-title" className="space-y-3">
        <h1 id="cart-title" className="font-display text-3xl font-bold">Your cart</h1>
        <ul className="space-y-3">
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const unavailable = product?.availability !== "available";
            return (
              <li key={item.lineId} className="flex gap-3 rounded-2xl border bg-white p-3 shadow-sm">
                <ProductImage emoji={item.emoji} name={item.productName} size="sm" className="size-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{item.productName}</h2>
                    <p className="font-bold tabular-nums">{peso(lineTotal(item))}</p>
                  </div>
                  {item.options.length > 0 && <p className="text-xs text-muted-foreground">{optionsSummary(item.options)}</p>}
                  {item.note && <p className="text-xs text-muted-foreground italic">“{item.note}”</p>}
                  {unavailable && (
                    <p className="text-xs font-semibold text-danger">This item became unavailable. Please remove it.</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1 rounded-full border p-0.5" role="group" aria-label={`Quantity of ${item.productName}`}>
                      <Button variant="ghost" size="icon" className="rounded-full" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => setCartQuantity(item.lineId, item.quantity - 1)}>
                        <Minus />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="rounded-full" aria-label="Increase quantity" onClick={() => setCartQuantity(item.lineId, item.quantity + 1)}>
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      {product && !unavailable && (
                        <Button variant="ghost" size="sm" onClick={() => openFor(product, item)}>
                          <Pencil /> Edit
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => removeFromCart(item.lineId)}>
                        <Trash2 /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Button asChild variant="outline" className="rounded-full"><Link href="/customer/menu"><Plus /> Add more items</Link></Button>
      </section>

      <aside aria-label="Order summary" className="h-fit space-y-3 rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-20">
        <h2 className="font-display text-xl font-semibold">Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{peso(subtotal)}</dd></div>
          <div className="flex justify-between text-muted-foreground"><dt>Service fee <span className="text-xs">(demo)</span></dt><dd className="tabular-nums">{peso(fees)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{peso(subtotal + fees)}</dd></div>
        </dl>
        <Button asChild size="lg" className="h-12 w-full rounded-full text-base font-bold">
          <Link href="/customer/checkout">PROCEED TO CHECKOUT</Link>
        </Button>
      </aside>
      {dialog}
    </div>
  );
}
