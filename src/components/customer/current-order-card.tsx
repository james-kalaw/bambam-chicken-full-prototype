"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Mascot, type MascotMood } from "@/components/shared/mascot";
import { StatusBadge } from "@/components/shared/badges";
import { ORDER_TYPE_LABELS } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/types/order";

export const CUSTOMER_STATUS_MOOD: Record<OrderStatus, MascotMood> = {
  pending_confirmation: "thinking",
  confirmed: "excited",
  preparing: "happy",
  completed: "approved",
  declined: "disappointed",
};

const ACTIVE: OrderStatus[] = ["pending_confirmation", "confirmed", "preparing"];

/** The signed-in customer's newest order that is still in progress */
export function useActiveCustomerOrder(): Order | undefined {
  const { orders, customerSession } = useDemoStore();
  if (!customerSession) return undefined;
  return orders.find((o) => o.customerId === customerSession.customerId && ACTIVE.includes(o.orderStatus));
}

export function CurrentOrderCard() {
  const order = useActiveCustomerOrder();
  if (!order) return null;

  return (
    <Link
      href={`/customer/orders/${order.id}`}
      className="flex items-center gap-3 rounded-2xl border-2 border-bambam-orange bg-white p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Mascot mood={CUSTOMER_STATUS_MOOD[order.orderStatus]} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Current order</p>
        <p className="font-display text-xl font-bold">{order.queueNumber}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge status={order.orderStatus} />
          <span className="text-xs text-muted-foreground">
            {ORDER_TYPE_LABELS[order.orderType]}
            {order.scheduledTime ? ` · ${order.scheduledTime}` : ""}
          </span>
        </div>
      </div>
      <ChevronRight className="text-muted-foreground" aria-hidden />
    </Link>
  );
}
