"use client";

import { Loader2, QrCode, Search, UserRound, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CUSTOMER_ID } from "@/data/customers";
import { maskMobile } from "@/lib/format";
import { useDemoStore } from "@/lib/store";
import type { Customer } from "@/types/people";
import type { LinkedCustomer } from "./use-pos-draft";

/**
 * Customer: [Guest / Walk-in]  [Link Customer]
 * Linking is OPTIONAL. Guests never create customer records.
 */
export function CustomerLinker({ customer, onChange }: { customer: LinkedCustomer | null; onChange: (c: LinkedCustomer | null) => void }) {
  const { customers } = useDemoStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Customer | null | "not_found">(null);
  const [scanning, setScanning] = useState(false);

  function find() {
    const q = query.trim().toUpperCase();
    const digits = query.replace(/\D/g, "");
    const found = customers.find((c) => c.id === q || (digits.length >= 10 && c.mobile === digits));
    setResult(found ?? "not_found");
  }

  function simulateScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const demo = customers.find((c) => c.id === DEMO_CUSTOMER_ID) ?? null;
      setResult(demo ?? "not_found");
      toast.info("Simulated QR scan — no camera is used in the prototype.");
    }, 900);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setResult(null);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
      <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-[11px] text-muted-foreground">Customer</p>
        {customer ? (
          <p className="truncate font-semibold">{customer.name} <span className="font-mono text-xs font-normal text-muted-foreground">{customer.id}</span></p>
        ) : (
          <p className="font-semibold">Guest / Walk-in</p>
        )}
      </div>
      {customer ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(null)} aria-label="Unlink customer"><X /> Unlink</Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}><UserPlus /> Link Customer</Button>
      )}

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find customer</DialogTitle>
            <DialogDescription>Optional. Linking adds this purchase to the customer&apos;s history.</DialogDescription>
          </DialogHeader>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); find(); }}>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="link-mobile">Mobile number or Customer ID</Label>
              <Input id="link-mobile" inputMode="tel" className="h-11" placeholder="0917 123 4567" value={query} onChange={(e) => { setQuery(e.target.value); setResult(null); }} autoFocus />
            </div>
            <Button type="submit" className="h-11" disabled={!query.trim()}><Search /> Find</Button>
          </form>
          <Button type="button" variant="outline" className="h-11" onClick={simulateScan} disabled={scanning}>
            {scanning ? <Loader2 className="animate-spin" /> : <QrCode />} Scan Customer QR <span className="text-xs text-muted-foreground">(simulated)</span>
          </Button>

          {result === "not_found" && (
            <p className="rounded-lg bg-muted p-3 text-sm">No Bambam account found. You can continue as <strong>Guest</strong> — no account is created.</p>
          )}
          {result && result !== "not_found" && (
            <div className="space-y-3 rounded-xl border-2 border-success/40 bg-success-soft/40 p-4" role="status">
              <p className="text-xs font-bold tracking-wide text-success uppercase">Customer found</p>
              <div>
                <p className="text-lg font-bold">{result.name}</p>
                <p className="font-mono text-sm">{result.id}</p>
                <p className="text-sm text-muted-foreground">
                  {result.onlineOrders + result.walkInOrders} previous orders · {maskMobile(result.mobile)}
                </p>
              </div>
              <Button
                className="h-11 w-full font-bold"
                onClick={() => {
                  onChange({ id: result.id, name: result.name });
                  toast.success(`${result.name} linked to this order`);
                  close();
                }}
              >
                LINK CUSTOMER
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
