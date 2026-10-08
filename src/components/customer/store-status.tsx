"use client";

import { PauseCircle, Store } from "lucide-react";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** "Open · Accepting Online Orders" or "Online Orders Temporarily Paused" */
export function StoreStatus({ className }: { className?: string }) {
  const { onlineOrderingOpen } = useDemoStore();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        onlineOrderingOpen ? "border-green-200 bg-success-soft text-success" : "border-amber-200 bg-warning-soft text-warning",
        className,
      )}
    >
      {onlineOrderingOpen ? <Store className="size-3.5" aria-hidden /> : <PauseCircle className="size-3.5" aria-hidden />}
      {onlineOrderingOpen ? "Open · Accepting Online Orders" : "Online Orders Temporarily Paused"}
    </span>
  );
}
