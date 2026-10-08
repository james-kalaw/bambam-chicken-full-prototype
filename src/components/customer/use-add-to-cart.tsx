"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CustomizeDialog } from "@/components/shared/customize-dialog";
import { Mascot } from "@/components/shared/mascot";
import { useDemoStore } from "@/lib/store";
import type { CartItem } from "@/types/order";
import type { Product } from "@/types/product";

/**
 * Shared "tap product → customize → add to cart" behavior for customer pages.
 * Returns a function to open the dialog, plus the dialog element to render.
 */
export function useAddToCart() {
  const { addToCart, updateCartItem } = useDemoStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState<CartItem | undefined>();
  const [open, setOpen] = useState(false);

  function openFor(p: Product, existing?: CartItem) {
    setProduct(p);
    setEditing(existing);
    setOpen(true);
  }

  function handleConfirm(item: CartItem) {
    if (editing) {
      updateCartItem(editing.lineId, item);
      toast.success("Cart updated");
      return;
    }
    addToCart(item);
    toast.custom(() => (
      <div className="flex w-[min(92vw,340px)] items-center gap-3 rounded-xl border bg-popover p-3 shadow-lg">
        <Mascot mood="excited" size="sm" />
        <div>
          <p className="font-display font-semibold">Added to cart!</p>
          <p className="text-sm text-muted-foreground">{item.quantity} × {item.productName}</p>
        </div>
      </div>
    ), { duration: 2500 });
  }

  const dialog = (
    <CustomizeDialog product={product} open={open} onOpenChange={setOpen} onConfirm={handleConfirm} initial={editing} />
  );

  return { openFor, dialog };
}
