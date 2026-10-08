"use client";

import { Info } from "lucide-react";
import { OrderQueue } from "@/components/admin/order-queue";
import { formatTime } from "@/lib/format";
import { isToday } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";

export default function KitchenPage() {
  const { orders } = useDemoStore();
  const active = orders.filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing");
  const recentlyDone = orders
    .filter((o) => o.orderStatus === "completed" && o.completedAt && isToday(o.completedAt))
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Kitchen Queue</h1>
          <p className="text-muted-foreground">
            {active.filter((o) => o.orderStatus === "confirmed").length} to start ·{" "}
            {active.filter((o) => o.orderStatus === "preparing").length} preparing
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" aria-hidden /> Sorted by confirmation time. Priority rules are pending owner approval.
        </p>
      </div>

      <OrderQueue />

      {recentlyDone.length > 0 && (
        <section aria-labelledby="done-title">
          <h2 id="done-title" className="mb-2 text-sm font-semibold text-muted-foreground uppercase">Recently completed</h2>
          <ul className="flex flex-wrap gap-2">
            {recentlyDone.map((o) => (
              <li key={o.id} className="rounded-lg border bg-success-soft px-3 py-1.5 text-sm font-bold text-success">
                {o.queueNumber} <span className="font-normal">· {formatTime(o.completedAt!)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
