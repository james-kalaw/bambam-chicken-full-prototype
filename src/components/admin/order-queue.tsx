"use client";

import { CheckCircle2, ChefHat, Clock, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderTypeIcon } from "@/components/shared/badges";
import { Mascot } from "@/components/shared/mascot";
import { minutesSince } from "@/lib/format";
import { CHANNEL_LABELS, itemsByGroup, ORDER_TYPE_LABELS } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

/** Add-ons are shown with a "+" so they stand out */
const ADD_ON_GROUPS = new Set(["add-ons", "toppings", "sinkers"]);

/** Re-render every 30s so "waiting" minutes stay current */
function useTick(ms = 30_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/**
 * One kitchen ticket. Shows NO prices or customer details — the kitchen only
 * needs what to cook. Status flow: Confirmed → Preparing → Completed.
 */
export function KitchenTicket({ order }: { order: Order }) {
  const { startPreparing, completeOrder } = useDemoStore();
  const preparing = order.orderStatus === "preparing";
  const waiting = minutesSince(order.confirmedAt ?? order.createdAt);

  return (
    <article
      aria-label={`Order ${order.queueNumber}`}
      className={cn(
        "flex flex-col rounded-2xl border-2 bg-card shadow-sm",
        preparing ? "border-bambam-orange" : "border-border",
      )}
    >
      <header className={cn("flex items-start justify-between gap-2 rounded-t-[14px] p-4", preparing ? "bg-accent" : "bg-muted/50")}>
        <div>
          <p className="text-4xl font-black tracking-tight">{order.queueNumber}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-base font-bold uppercase">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <OrderTypeIcon type={order.orderType} className="size-5" />
              {CHANNEL_LABELS[order.channel]} · {ORDER_TYPE_LABELS[order.orderType]}
            </span>
            {order.scheduledTime && order.scheduledTime !== "ASAP" && <span className="whitespace-nowrap">— {order.scheduledTime}</span>}
          </p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold",
              preparing ? "bg-bambam-orange text-bambam-brown" : "bg-sky-100 text-sky-900",
            )}
          >
            {preparing ? <ChefHat className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
            {preparing ? "PREPARING" : "CONFIRMED"}
          </span>
          <p className={cn("mt-1 flex items-center justify-end gap-1 text-sm font-semibold", waiting >= 15 ? "text-danger" : "text-muted-foreground")}>
            <Clock className="size-4" aria-hidden /> {waiting} min
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 p-4">
        {itemsByGroup(order).map((section) => (
          <section key={section.label ?? "all"} aria-label={section.label ?? undefined}>
            {section.label && (
              <p className="mb-1 rounded-md bg-muted px-2 py-0.5 text-sm font-black tracking-wide uppercase">{section.label}</p>
            )}
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item.lineId}>
                  <p className="text-xl font-bold">
                    {item.quantity} × {item.productName}
                  </p>
                  {item.options.length > 0 && (
                    <ul className="mt-0.5 space-y-0.5 pl-6 text-base">
                      {item.options.map((o) => (
                        <li key={o.choiceId} className={ADD_ON_GROUPS.has(o.groupId) ? "font-semibold" : ""}>
                          {ADD_ON_GROUPS.has(o.groupId) ? `+ ${o.choiceLabel}` : o.choiceLabel}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.note && (
                    <p className="mt-1 ml-6 inline-flex items-center gap-1.5 rounded-md bg-bambam-yellow px-2 py-0.5 text-sm font-semibold">
                      <StickyNote className="size-4" aria-hidden /> {item.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="p-4 pt-0">
        {preparing ? (
          <Button
            size="lg"
            className="h-14 w-full bg-success text-lg font-black text-white hover:bg-success/90"
            onClick={() => {
              completeOrder(order.id);
              toast.custom(() => (
                <div className="flex items-center gap-3 rounded-xl border bg-popover p-3 shadow-lg">
                  <Mascot mood="approved" size="sm" />
                  <p className="font-semibold">{order.queueNumber} completed!</p>
                </div>
              ), { duration: 2500 });
            }}
          >
            MARK COMPLETED
          </Button>
        ) : (
          <Button size="lg" className="h-14 w-full bg-bambam-brown text-lg font-black text-white hover:bg-bambam-brown/90" onClick={() => startPreparing(order.id)}>
            START PREPARING
          </Button>
        )}
      </div>
    </article>
  );
}

/**
 * The unified kitchen queue: all order types in one list.
 * Order: first confirmed, first shown. The real priority rules (pickup time,
 * prep duration, workload) still need owner approval, so none are hardcoded.
 */
export function OrderQueue() {
  useTick();
  const { orders } = useDemoStore();
  const queue = orders
    .filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing")
    .sort((a, b) => (a.confirmedAt ?? a.createdAt).localeCompare(b.confirmedAt ?? b.createdAt));

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
        <Mascot mood="approved" size="lg" />
        <p className="mt-3 text-3xl font-black">All caught up!</p>
        <p className="text-muted-foreground">New confirmed orders will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
      {queue.map((o) => <KitchenTicket key={o.id} order={o} />)}
    </div>
  );
}
