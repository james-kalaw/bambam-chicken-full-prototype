"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { CUSTOMER_STATUS_MOOD } from "@/components/customer/current-order-card";
import { OrderTracker } from "@/components/customer/order-tracker";
import { useReorder } from "@/components/customer/use-reorder";
import { ChannelBadge, OrderTypeBadge } from "@/components/shared/badges";
import { CustomerPaymentCard } from "@/components/customer/customer-payment-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Mascot } from "@/components/shared/mascot";
import { formatDateTime, peso } from "@/lib/format";
import { lineTotal, optionsSummary } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/types/order";

const HEADLINES: Record<OrderStatus, { title: string; body: (o: Order) => string }> = {
  pending_confirmation: { title: "Order submitted!", body: () => "Waiting for Bambam to confirm your order. We'll notify you right away." },
  confirmed: { title: "Bam! Your order is confirmed.", body: () => "It's in the kitchen queue now." },
  preparing: { title: "Your order is being prepared", body: () => "Our crew is cooking it fresh." },
  completed: { title: "Order completed!", body: () => "Enjoy your Bambam!" },
  declined: { title: "Sorry, your order could not be accepted.", body: (o) => `Reason: ${o.declineReason ?? "Not specified"}` },
};

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const justPlaced = useSearchParams().get("placed") === "1";
  const { orders, customerSession } = useDemoStore();
  const reorder = useReorder();
  const order = orders.find((o) => o.id === id && o.customerId === customerSession?.customerId);

  if (!order) {
    return (
      <EmptyState
        mood="disappointed"
        title="We couldn't find that order"
        description="It may belong to another account."
        action={<Button asChild className="rounded-full"><Link href="/customer/orders">My orders</Link></Button>}
      />
    );
  }

  const headline = HEADLINES[order.orderStatus];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/customer/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> My orders
      </Link>

      {/* Status hero — announced to screen readers when it changes */}
      <section className="rounded-3xl bg-white p-6 text-center shadow-sm" aria-live="polite">
        <Mascot mood={CUSTOMER_STATUS_MOOD[order.orderStatus]} size="lg" className="mx-auto" />
        {justPlaced && order.orderStatus === "pending_confirmation" && (
          <p className="mt-2 text-sm font-semibold text-bambam-red">Your order number is</p>
        )}
        <p className="font-display text-5xl font-bold tracking-tight">{order.queueNumber}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">{headline.title}</h1>
        <p className="text-muted-foreground">{headline.body(order)}</p>
        {order.orderStatus !== "declined" && (
          <div className="mt-6">
            <OrderTracker order={order} />
          </div>
        )}
      </section>

      {/* Order status and payment status are shown separately on purpose */}
      <section className="grid items-start gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Order</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ChannelBadge channel={order.channel} />
            <OrderTypeBadge type={order.orderType} />
            {order.scheduledTime && <span className="text-sm font-semibold">{order.scheduledTime === "ASAP" ? "ASAP" : `Pickup ${order.scheduledTime}`}</span>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <CustomerPaymentCard order={order} />
      </section>

      {order.delivery && (
        <section className="rounded-2xl border bg-white p-4 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Delivery</p>
          <p className="mt-1 font-semibold">{order.delivery.address}</p>
          {order.delivery.landmark && <p className="text-muted-foreground">Landmark: {order.delivery.landmark}</p>}
          <p className="mt-1 text-xs text-warning">Delivery arrangement is subject to restaurant confirmation.</p>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Items</h2>
        <ul className="mt-2 divide-y text-sm">
          {order.items.map((item) => (
            <li key={item.lineId} className="flex justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{item.quantity} × {item.productName}</span>
                {item.options.length > 0 && <span className="block text-xs text-muted-foreground">{optionsSummary(item.options)}</span>}
                {item.note && <span className="block text-xs text-muted-foreground italic">“{item.note}”</span>}
              </span>
              <span className="shrink-0 tabular-nums">{peso(lineTotal(item))}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span className="tabular-nums">{peso(order.total)}</span>
        </div>
      </section>

      {(order.orderStatus === "completed" || order.orderStatus === "declined") && (
        <Button size="lg" variant="outline" className="w-full rounded-full" onClick={() => reorder(order)}>
          <RotateCcw /> Order this again
        </Button>
      )}
    </div>
  );
}
