"use client";

import { Clock, Users } from "lucide-react";
import { ChannelBadge, CustomerBadge, OrderTypeBadge, PaymentBadge, StatusBadge } from "@/components/shared/badges";
import { peso, timeAgo } from "@/lib/format";
import { itemCount, paymentMethodText } from "@/lib/order-utils";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

/** Compact order summary used in admin lists. Click opens the order dialog. */
export function OrderCard({ order, onOpen }: { order: Order; onOpen: (order: Order) => void }) {
  const pending = order.orderStatus === "pending_confirmation";
  const n = itemCount(order.items);
  return (
    <button
      type="button"
      onClick={() => onOpen(order)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left shadow-xs transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring",
        pending && "border-amber-300 bg-warning-soft/30",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xl font-bold tracking-tight">{order.queueNumber}</span>
        <ChannelBadge channel={order.channel} />
        <OrderTypeBadge type={order.orderType} />
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(order.createdAt)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-mono text-muted-foreground">{order.id}</span>
        <CustomerBadge customerId={order.customerId} name={order.customerName} />
        {order.scheduledTime && (
          <span className="inline-flex items-center gap-1 font-semibold">
            <Clock className="size-3.5" aria-hidden /> {order.scheduledTime}
          </span>
        )}
        {order.groups && (
          <span className="inline-flex items-center gap-1 font-semibold">
            <Users className="size-3.5" aria-hidden /> {order.groups.length} people
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.orderStatus} />
        <PaymentBadge status={order.payment.status} />
        <span className="text-xs text-muted-foreground">{paymentMethodText(order)}</span>
        <span className="ml-auto text-sm font-bold tabular-nums">
          {peso(order.total)} <span className="text-xs font-normal text-muted-foreground">· {n} item{n === 1 ? "" : "s"}</span>
        </span>
      </div>
    </button>
  );
}
