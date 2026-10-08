"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { makeId } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import type { Order } from "@/types/order";

/** Copies a past order's available items back into the cart */
export function useReorder() {
  const router = useRouter();
  const { products, addToCart } = useDemoStore();

  return (order: Order) => {
    const available = order.items.filter((i) => products.find((p) => p.id === i.productId)?.availability === "available");
    available.forEach((item) => addToCart({ ...item, lineId: makeId("line") }));
    if (available.length < order.items.length) {
      toast.warning("Some items are currently unavailable and were skipped.");
    } else {
      toast.success(`Added ${order.queueNumber} items to your cart`);
    }
    router.push("/customer/cart");
  };
}
