"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StockBadge } from "@/components/shared/badges";
import { Mascot } from "@/components/shared/mascot";
import { qty } from "@/lib/format";
import { getStockStatus } from "@/lib/inventory-utils";
import { useDemoStore, type StockOutReason } from "@/lib/store";
import { cn } from "@/lib/utils";

/** The inventory operations an owner/manager can perform */
export type StockAction = "stock_in" | "adjust" | "waste" | "spoilage" | "other_out" | "threshold";

const TITLES: Record<StockAction, string> = {
  stock_in: "Add stock",
  adjust: "Adjust inventory",
  waste: "Record waste",
  spoilage: "Record spoilage",
  other_out: "Other stock out",
  threshold: "Set low-stock threshold",
};

const OUT_REASONS: StockOutReason[] = ["Waste", "Spoilage", "Complimentary Food", "Staff Meal", "Damaged", "Other Stock Out"];
const DEFAULT_REASON: Partial<Record<StockAction, StockOutReason>> = { waste: "Waste", spoilage: "Spoilage", other_out: "Other Stock Out" };

const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => v.replace(/[^\d.]/g, "");

interface Props {
  action: StockAction | null;
  /** Pre-selected ingredient (from the item sheet). If empty, the user picks one. */
  itemId?: string | null;
  onClose: () => void;
}

export function StockActionDialog({ action, itemId, onClose }: Props) {
  return (
    <Dialog open={!!action} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {action && <StockActionForm key={`${action}-${itemId ?? ""}`} action={action} initialItemId={itemId ?? ""} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function StockActionForm({ action, initialItemId, onClose }: { action: StockAction; initialItemId: string; onClose: () => void }) {
  const store = useDemoStore();
  const ids = { item: useId(), amount: useId(), cost: useId(), supplier: useId(), date: useId(), note: useId(), reason: useId() };
  const [itemId, setItemId] = useState(initialItemId);
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [receivedDate, setReceivedDate] = useState(today());
  const [note, setNote] = useState(action === "adjust" ? "Physical count correction" : "");
  const [reason, setReason] = useState<StockOutReason>(DEFAULT_REASON[action] ?? "Waste");
  const [result, setResult] = useState<{ before: number; after: number; unit: string; label: string } | null>(null);

  const item = store.inventory.find((i) => i.id === itemId);
  const value = Number(amount);
  const hasValue = amount !== "" && !Number.isNaN(value);

  // What the stock will be after saving
  const preview = !item || !hasValue ? null
    : action === "stock_in" ? item.quantity + value
    : action === "adjust" ? value
    : action === "threshold" ? null
    : Math.max(0, item.quantity - value);

  const valid = !!item && hasValue && (action === "adjust" || action === "threshold" ? value >= 0 : value > 0)
    && (action !== "adjust" || note.trim().length > 0);

  function save() {
    if (!item || !valid) return;
    const before = item.quantity;
    if (action === "stock_in") {
      store.recordStockIn(item.id, value, { purchaseCost: cost ? Number(cost) : undefined, supplier: supplier.trim() || undefined, receivedDate, note: note.trim() || undefined });
    } else if (action === "adjust") {
      store.adjustToCount(item.id, value, note.trim());
    } else if (action === "threshold") {
      store.setLowStockThreshold(item.id, value);
      toast.success(`${item.name}: low-stock threshold set to ${qty(value)} ${item.unit}`);
      onClose();
      return;
    } else {
      store.recordStockOut(item.id, reason, value, note.trim() || undefined);
    }
    setResult({ before, after: preview ?? before, unit: item.unit, label: action === "stock_in" ? "Added" : action === "adjust" ? "Difference" : "Removed" });
  }

  if (result && item) {
    const diff = result.after - result.before;
    return (
      <div className="space-y-3 text-center" role="status">
        <Mascot mood="approved" size="md" className="mx-auto" />
        <DialogTitle className="text-xl font-bold">Inventory updated successfully.</DialogTitle>
        <DialogDescription>{item.name} · saved to movement history and the audit log.</DialogDescription>
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">Previous</dt><dd className="font-semibold tabular-nums">{qty(result.before)} {result.unit}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{result.label}</dt><dd className={cn("font-semibold tabular-nums", diff >= 0 ? "text-success" : "text-danger")}>{diff >= 0 ? "+" : "−"}{qty(Math.abs(diff))} {result.unit}</dd></div>
          <div><dt className="text-xs text-muted-foreground">New stock</dt><dd className="font-bold tabular-nums">{qty(result.after)} {result.unit}</dd></div>
        </dl>
        <Button className="w-full" onClick={onClose}>Done</Button>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{TITLES[action]}</DialogTitle>
        <DialogDescription>Every change is saved as a stock movement and in the audit log. Units are demo placeholders.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={ids.item}>Ingredient</Label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger id={ids.item} className="h-10 w-full"><SelectValue placeholder="Choose ingredient" /></SelectTrigger>
            <SelectContent position="popper">
              {store.inventory.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {item && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span>{action === "adjust" ? "System quantity" : "Current stock"}: <strong className="tabular-nums">{qty(item.quantity)} {item.unit}</strong></span>
            <StockBadge status={getStockStatus(item)} />
          </div>
        )}

        {action === "threshold" ? (
          <div className="space-y-1.5">
            <Label htmlFor={ids.amount}>Low-stock threshold ({item?.unit ?? "unit"})</Label>
            <Input id={ids.amount} inputMode="decimal" className="h-11 text-lg" placeholder={item ? qty(item.lowStockThreshold) : ""} value={amount} onChange={(e) => setAmount(num(e.target.value))} />
            <p className="text-xs text-muted-foreground">Below this, the item shows as “Low Stock”. Critical = half of it (demo rule).</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor={ids.amount}>
              {action === "stock_in" ? "Quantity added" : action === "adjust" ? "Actual physical count" : "Quantity"} ({item?.unit ?? "unit"})
            </Label>
            <Input id={ids.amount} inputMode="decimal" className="h-11 text-lg" value={amount} onChange={(e) => setAmount(num(e.target.value))} />
            {item && preview !== null && (
              <p className="text-sm text-muted-foreground">
                {action === "adjust" ? (
                  <>Difference: <strong className={cn(preview - item.quantity >= 0 ? "text-success" : "text-danger")}>{preview - item.quantity >= 0 ? "+" : "−"}{qty(Math.abs(preview - item.quantity))} {item.unit}</strong></>
                ) : (
                  <>New stock: <strong className="text-foreground">{qty(preview)} {item.unit}</strong></>
                )}
              </p>
            )}
          </div>
        )}

        {(action === "waste" || action === "spoilage" || action === "other_out") && (
          <div className="space-y-1.5">
            <Label htmlFor={ids.reason}>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as StockOutReason)}>
              <SelectTrigger id={ids.reason} className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                {OUT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {action === "stock_in" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={ids.cost}>Purchase cost <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id={ids.cost} inputMode="decimal" placeholder="₱" value={cost} onChange={(e) => setCost(num(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={ids.date}>Received date</Label>
              <Input id={ids.date} type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={ids.supplier}>Supplier <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id={ids.supplier} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
          </div>
        )}

        {action !== "threshold" && (
          <div className="space-y-1.5">
            <Label htmlFor={ids.note}>{action === "adjust" ? "Reason" : <>Notes <span className="font-normal text-muted-foreground">(optional)</span></>}</Label>
            <Textarea id={ids.note} value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!valid} onClick={save}>
          {action === "stock_in" ? "SAVE STOCK IN" : action === "adjust" ? "SAVE ADJUSTMENT" : action === "threshold" ? "SAVE THRESHOLD" : "RECORD"}
        </Button>
      </DialogFooter>
    </>
  );
}
