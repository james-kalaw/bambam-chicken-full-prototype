"use client";

import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelBadge, OrderTypeBadge, PaymentBadge } from "@/components/shared/badges";
import { Mascot } from "@/components/shared/mascot";
import { peso } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import type { Order } from "@/types/order";

/** Shown after the cashier confirms: queue number, IDs, change due */
export function PosReceipt({ order, onNewOrder }: { order: Order; onNewOrder: () => void }) {
  const p = order.payment;
  return (
    <aside aria-label="Order confirmed" className="flex h-fit flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-sm lg:sticky lg:top-20" role="status">
      <Mascot mood="approved" size="md" />
      <p className="text-sm text-muted-foreground">Sent to the kitchen</p>
      <p className="text-5xl font-black tracking-tight">{order.queueNumber}</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        <ChannelBadge channel={order.channel} />
        <OrderTypeBadge type={order.orderType} />
        <PaymentBadge status={p.status} />
      </div>

      {p.method === "cash" && p.status === "paid" && p.changeGiven !== undefined && (
        <div className="w-full rounded-xl bg-success-soft p-3">
          <p className="text-sm text-success">Change to give</p>
          <p className="text-3xl font-black text-success tabular-nums">{peso(p.changeGiven)}</p>
        </div>
      )}

      <dl className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-muted/50 p-3 text-left text-xs">
        <div><dt className="text-muted-foreground">Order ID</dt><dd className="font-mono font-semibold break-all">{order.id}</dd></div>
        <div><dt className="text-muted-foreground">Payment ID</dt><dd className="font-mono font-semibold break-all">{p.id}</dd></div>
        <div><dt className="text-muted-foreground">Customer</dt><dd className="font-semibold">{order.customerId ? `${order.customerName} (${order.customerId})` : "Guest"}</dd></div>
        <div><dt className="text-muted-foreground">Total</dt><dd className="font-semibold tabular-nums">{peso(order.total)} · {PAYMENT_METHOD_LABELS[p.method]}</dd></div>
        {p.cashReceived !== undefined && (
          <div className="col-span-2"><dt className="text-muted-foreground">Cash received → recorded sale</dt><dd className="tabular-nums">{peso(p.cashReceived)} → {peso(order.total)}</dd></div>
        )}
        {order.groups && <div className="col-span-2"><dt className="text-muted-foreground">Group order</dt><dd>{order.groups.length} people · one order</dd></div>}
      </dl>

      {!order.customerId && (
        <div className="flex w-full items-center gap-3 rounded-lg border border-dashed p-3 text-left text-xs text-muted-foreground">
          <QrCode className="size-8 shrink-0" aria-hidden />
          <p><span className="font-semibold text-foreground">Want to save this purchase to your Bambam account?</span> Future feature: the customer scans a receipt QR to claim it.</p>
        </div>
      )}

      <Button size="lg" className="h-12 w-full text-base font-bold" onClick={onNewOrder}>New order</Button>
    </aside>
  );
}
