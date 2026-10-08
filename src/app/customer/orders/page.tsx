"use client";

import { ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CurrentOrderCard } from "@/components/customer/current-order-card";
import { useReorder } from "@/components/customer/use-reorder";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, peso } from "@/lib/format";
import { itemCount, ORDER_TYPE_LABELS } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";

export default function CustomerOrdersPage() {
  const { orders, customerSession } = useDemoStore();
  const reorder = useReorder();

  if (!customerSession) {
    return (
      <EmptyState
        mood="happy"
        title="Sign in to see your orders"
        description="Your order history, favorites and reorders live here."
        action={<Button asChild className="rounded-full"><Link href="/auth/customer?next=/customer/orders">Sign in with mobile</Link></Button>}
      />
    );
  }

  const mine = orders.filter((o) => o.customerId === customerSession.customerId);
  const history = mine.filter((o) => o.orderStatus === "completed" || o.orderStatus === "declined");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold">My orders</h1>
      <CurrentOrderCard />

      <section aria-labelledby="history-title" className="space-y-3">
        <h2 id="history-title" className="font-display text-xl font-semibold">Order history</h2>
        {history.length === 0 ? (
          <EmptyState mood="happy" title="No Bambam orders yet." description="Your next favorite meal could be your first." />
        ) : (
          <ul className="space-y-3">
            {history.map((o) => (
              <li key={o.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <Link href={`/customer/orders/${o.id}`} className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-bold">{o.queueNumber}</span>
                      <StatusBadge status={o.orderStatus} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt)} · {o.channel === "walk_in" ? "In-store" : "Online"} {ORDER_TYPE_LABELS[o.orderType]} · {itemCount(o.items)} item{itemCount(o.items) === 1 ? "" : "s"} · <span className="font-semibold text-foreground">{peso(o.total)}</span>
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground" aria-hidden />
                </Link>
                <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => reorder(o)}>
                  <RotateCcw /> Reorder
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
