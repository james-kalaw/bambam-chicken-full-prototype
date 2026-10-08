import { Check, ChefHat, Hourglass, PackageCheck, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order";
import { formatTime } from "@/lib/format";

// Customer-facing progress. Kitchen statuses stay simple:
// Confirmed → Preparing → Completed (there is no "Ready" step on purpose).

const STEPS: { status: OrderStatus; label: string; icon: typeof Check; timeKey: keyof Order }[] = [
  { status: "pending_confirmation", label: "Submitted", icon: Hourglass, timeKey: "createdAt" },
  { status: "confirmed", label: "Confirmed", icon: ThumbsUp, timeKey: "confirmedAt" },
  { status: "preparing", label: "Preparing", icon: ChefHat, timeKey: "preparingAt" },
  { status: "completed", label: "Completed", icon: PackageCheck, timeKey: "completedAt" },
];

export function OrderTracker({ order }: { order: Order }) {
  const currentIndex = STEPS.findIndex((s) => s.status === order.orderStatus);

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < currentIndex || order.orderStatus === "completed";
        const current = i === currentIndex && order.orderStatus !== "completed";
        const time = order[step.timeKey];
        return (
          <li key={step.status} className="flex flex-col items-center text-center" aria-current={current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-1 flex-1 rounded-full", i === 0 ? "invisible" : done || current ? "bg-bambam-orange" : "bg-muted")} />
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full border-2",
                  done && "border-bambam-orange bg-bambam-orange text-white",
                  current && "border-bambam-orange bg-white text-bambam-red ring-4 ring-orange-100",
                  !done && !current && "border-muted bg-white text-muted-foreground",
                )}
              >
                {done ? <Check className="size-5" aria-hidden /> : <step.icon className="size-5" aria-hidden />}
              </span>
              <span className={cn("h-1 flex-1 rounded-full", i === STEPS.length - 1 ? "invisible" : done ? "bg-bambam-orange" : "bg-muted")} />
            </div>
            <span className={cn("mt-1.5 text-xs font-semibold", !done && !current && "text-muted-foreground")}>
              {step.label}
              <span className="sr-only">{done ? " (done)" : current ? " (current step)" : " (upcoming)"}</span>
            </span>
            {typeof time === "string" && (done || current) && (
              <span className="text-[11px] text-muted-foreground">{formatTime(time)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
