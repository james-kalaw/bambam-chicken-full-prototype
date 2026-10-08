"use client";

import { Gauge, History, MinusCircle, PlusCircle, Recycle, SlidersHorizontal, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StockBadge } from "@/components/shared/badges";
import { qty, timeAgo } from "@/lib/format";
import { getStockStatus } from "@/lib/inventory-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { StockAction } from "./stock-action-dialog";

/** Bottom sheet on phones, side sheet on larger screens */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * Tap an ingredient → this sheet: current stock, status, threshold,
 * the actions, and its movement history. (No buttons in every table row.)
 */
export function InventoryItemSheet({
  itemId,
  canManage,
  onClose,
  onAction,
}: {
  itemId: string | null;
  canManage: boolean;
  onClose: () => void;
  onAction: (action: StockAction, itemId: string) => void;
}) {
  const { inventory, inventoryLog } = useDemoStore();
  const mobile = useIsMobile();
  const [showHistory, setShowHistory] = useState(false);
  const item = inventory.find((i) => i.id === itemId);
  const history = inventoryLog.filter((t) => t.itemId === itemId).slice(0, 20);

  const actions: { action: StockAction; label: string; icon: typeof PlusCircle; primary?: boolean }[] = [
    { action: "stock_in", label: "Add Stock", icon: PlusCircle, primary: true },
    { action: "adjust", label: "Adjust Quantity", icon: SlidersHorizontal },
    { action: "waste", label: "Record Waste", icon: Trash },
    { action: "spoilage", label: "Record Spoilage", icon: Recycle },
    { action: "other_out", label: "Other Stock Out", icon: MinusCircle },
    { action: "threshold", label: "Set Threshold", icon: Gauge },
  ];

  return (
    <Sheet open={!!item} onOpenChange={(o) => { if (!o) { onClose(); setShowHistory(false); } }}>
      <SheetContent side={mobile ? "bottom" : "right"} className={cn("gap-0 overflow-y-auto", mobile ? "max-h-[88dvh] rounded-t-2xl" : "w-full sm:max-w-md")}>
        {item && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="text-xl">{item.name}</SheetTitle>
              <SheetDescription>{item.category} · demo units</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-muted/50 p-2.5"><dt className="text-xs text-muted-foreground">Current stock</dt><dd className="text-lg font-bold tabular-nums">{qty(item.quantity)} {item.unit}</dd></div>
                <div className="rounded-lg bg-muted/50 p-2.5"><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1"><StockBadge status={getStockStatus(item)} /></dd></div>
                <div className="rounded-lg bg-muted/50 p-2.5"><dt className="text-xs text-muted-foreground">Low-stock at</dt><dd className="text-lg font-bold tabular-nums">{qty(item.lowStockThreshold)} {item.unit}</dd></div>
              </dl>

              {canManage ? (
                <div className="grid grid-cols-2 gap-2">
                  {actions.map((a) => (
                    <Button key={a.action} variant={a.primary ? "default" : "outline"} className={cn("h-11 justify-start", a.primary && "col-span-2")} onClick={() => onAction(a.action, item.id)}>
                      <a.icon /> {a.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Read-only for your role. Stock changes are done by the Owner or an authorized Manager.</p>
              )}

              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
                <History /> {showHistory ? "Hide" : "View"} movement history ({history.length})
              </Button>
              {showHistory && (
                <ul className="divide-y text-sm">
                  {history.length === 0 && <li className="py-2 text-muted-foreground">No movements yet.</li>}
                  {history.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-x-2 py-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{t.type}</span>
                      <span className={cn("font-semibold tabular-nums", t.change >= 0 ? "text-success" : "text-danger")}>
                        {t.change >= 0 ? "+" : "−"}{qty(Math.abs(t.change))} {t.unit}
                      </span>
                      {t.relatedOrder && <span className="text-xs text-muted-foreground">{t.relatedOrder}</span>}
                      <span className="ml-auto text-xs text-muted-foreground">{t.by} · {timeAgo(t.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
