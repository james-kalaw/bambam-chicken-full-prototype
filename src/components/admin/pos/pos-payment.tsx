"use client";

import { BadgeCheck, Clock } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CashPaymentPanel, PaymentQr } from "@/components/shared/payment-panels";
import { peso } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/order";

export interface PosPaymentResult {
  method: PaymentMethod;
  paid: boolean;
  cashReceived?: number;
  providerReference?: string;
}

const METHODS: PaymentMethod[] = ["cash", "gcash", "maya", "bank_transfer"];

/**
 * Walk-in payment at the counter.
 * - Cash: enter cash received → change is calculated. The sale is the ORDER TOTAL.
 * - GCash/Maya/Bank: show the Bambam QR → customer pays on their phone →
 *   cashier checks the success screen → "Mark payment verified". No screenshot upload.
 * - Pay later: order goes to the kitchen as Unpaid.
 */
export function PosPaymentSection({
  total,
  initialMethod = "cash",
  blockedReason,
  onConfirm,
}: {
  total: number;
  initialMethod?: PaymentMethod;
  /** If set, the confirm button is disabled and this reason is shown */
  blockedReason?: string;
  onConfirm: (payment: PosPaymentResult) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [payLater, setPayLater] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [reference, setReference] = useState("");
  const refId = useId();
  const laterId = useId();

  const cash = Number(cashReceived) || 0;
  const cashShort = method === "cash" && !payLater && cash < total;
  const disabled = !!blockedReason || total <= 0 || cashShort;

  function confirm() {
    onConfirm({
      method,
      paid: !payLater,
      cashReceived: method === "cash" && !payLater ? cash : undefined,
      providerReference: method !== "cash" && !payLater ? reference.trim() || undefined : undefined,
    });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold">Payment</legend>
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Payment method">
        {METHODS.map((m) => (
          <Button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            variant={method === m ? "default" : "outline"}
            className="h-11 px-1 text-xs sm:text-sm"
            onClick={() => setMethod(m)}
          >
            {m === "bank_transfer" ? "Bank" : PAYMENT_METHOD_LABELS[m]}
          </Button>
        ))}
      </div>

      {!payLater && method === "cash" && <CashPaymentPanel total={total} cashReceived={cashReceived} onChange={setCashReceived} />}
      {!payLater && method !== "cash" && (
        <div className="space-y-2">
          <PaymentQr method={method} amount={total} />
          <p className="text-xs text-muted-foreground">Customer pays on their phone, then shows you the success screen.</p>
          <div className="space-y-1">
            <Label htmlFor={refId} className="text-xs">Provider reference <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id={refId} inputMode="numeric" className="h-9" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>
      )}

      <label htmlFor={laterId} className="flex items-center gap-2 text-sm">
        <input id={laterId} type="checkbox" className="size-4 accent-bambam-red" checked={payLater} onChange={(e) => setPayLater(e.target.checked)} />
        Pay later (order stays Unpaid)
      </label>

      {blockedReason && <p className="text-sm font-medium text-warning">{blockedReason}</p>}

      <Button
        size="lg"
        className={cn("h-14 w-full text-base font-black", !payLater && method !== "cash" && "bg-success text-white hover:bg-success/90")}
        disabled={disabled}
        onClick={confirm}
      >
        {payLater ? (
          <><Clock /> CONFIRM ORDER · UNPAID</>
        ) : method === "cash" ? (
          `CONFIRM ORDER · ${peso(total)}`
        ) : (
          <><BadgeCheck /> MARK PAYMENT VERIFIED & CONFIRM</>
        )}
      </Button>
    </fieldset>
  );
}
